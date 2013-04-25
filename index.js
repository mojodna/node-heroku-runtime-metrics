"use strict";

if (!process.env.HEROKU_API_KEY || !process.env.APPS) {
  console.error("Please provide HEROKU_API_KEY and APPS.");
  process.exit(1);
}

var util = require("util");
var metricsd = require("metricsd"),
    metrics = metricsd({
      host: process.env.METRICSD_HOST,
      port: process.env.METRICSD_PORT,
      prefix: process.env.METRICSD_PREFIX
    }),
    request = require("request");

var DEBUG = process.env.DEBUG;
var HEROKU_API_KEY = process.env.HEROKU_API_KEY;

// TODO extract this into lib/
var processLogs = function(app) {
  request.get({
    url: util.format("https://api.heroku.com/apps/%s/logs?logplex=true&tail=1", app),
    auth: {
      user: "_",
      pass: HEROKU_API_KEY
    }
  }, function(err, rsp, body) {
    if (err) {
      console.error(err);
      return;
    }

    if (rsp.statusCode === 200) {
      var pending = '';

      request.get(body)
        .on("data", function(chunk) {
          pending += chunk.toString();

          // 2013-04-21T23:35:49.424955+00:00 heroku[web.1]: source=heroku.14431912.web.1.2a5d39f6-8bca-461e-b016-67acc29c5ee5 measure=memory_pgpgout val=20219 units=pages

          pending.replace("\n", "$\n").split("\n").forEach(function(line) {
            if (line.slice(-1) !== "$") {
              pending = line;
              return;
            }

            line = line.slice(0, -1);

            var matches;
            if ((matches = line.match(/(\S+)\s(\w+)\[(\w|.+)\]\:\s(.*)/))) {
              if (matches[2] !== "heroku") {
                return;
              }

              // console.log(":", line);

              // TODO get ps index from matches[3] to track more than 1 dyno
              var ps = matches[3].split(".")[0];
              var kvp = matches[4].split(/(\S+=(?:\"[^\"]*\"|\S+))\s?/).filter(function(x) {
                return !!x;
              }).map(function(x) {
                return x.split("=", 2);
              });

              var data = {};

              kvp.forEach(function(x) {
                data[x[0]] = x[1];
              });

              var metric = {};

              if (ps === "router") {
                metric = {
                  connect: +(data["connect"].slice(0, -2)),
                  service: +(data["service"].slice(0, -2)),
                  status: data["status"][0] + "xx"
                };

                metrics.updateHistogram(util.format("%s.connect", app), metric.connect);
                metrics.updateHistogram(util.format("%s.service", app), metric.service);
                metrics.mark(util.format("%s.status.%s", app, metric.status));
              } else if (ps === "web") {
                if (data["measure"] && data["val"]) {
                  var val = +data["val"];

                  if (data["measure"].match(/^load_avg/)) {
                    val = val * 100;
                  } else if (data["measure"].match(/^memory/)) {
                    // convert to KB
                    val = val * 1024;
                  } else {
                    val = val;
                  }

                  metric[data["measure"]] = Math.round(val);

                  metrics.updateGauge(util.format("%s.%s", app, data["measure"]), Math.round(val));
                } else {
                  if (DEBUG) {
                    console.log(line);
                  }
                }
              }

              if (Object.keys(metric).length > 0) {
                metric["timestamp"] = ~~(Date.parse(matches[1]) / 1000);
                if (DEBUG) {
                  console.log("metric:", metric);
                }
              }
            }
          });
        }).on("end", function() {
          console.log("Stream ended; reconnecting...");
          processLogs();
        }).on("error", function(err) {
          console.error(err);
        });
    }
  });
};

process.env.APPS.split(" ").forEach(function(app) {
  console.log("Processing '%s' logs.", app);
  processLogs(app);
});
