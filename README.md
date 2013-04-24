# node-heroku-runtime-metrics

I am a worker app that consumes Heroku log streams and emits metrics to
metricsd.

## Environment Variables

* `METRICSD_HOST` - metricsd hostname
* `METRICSD_PORT` - metricsd port
* `METRICSD_PREFIX` - metricsd prefix
* `API_TOKEN` - Heroku API token
* `APPS` - space-delimited list of Heroku apps to track

## TODO

* Write gauge values directly to Graphite (to avoid ghost values, which are
  more acute when dynos idle)
* Track memory usage, etc. on more than one dyno
