# node-heroku-metricsd-bridge

**NOTE**: If you're thinking of using this, you may want to run
[`heroku-syslog-metricsd-bridge`](https://github.com/mojodna/node-heroku-syslog-metricsd-bridge)
on the same server as `metricsd` itself (in us-east-1). This drops log
messages (when the stream disconnects) where a syslog drain is more reliable.

I am a worker app that consumes Heroku log streams and emits metrics to
metricsd.

See also [Heroku Logging](https://devcenter.heroku.com/articles/logging).

## Environment Variables

* `METRICSD_HOST` - metricsd hostname
* `METRICSD_PORT` - metricsd port
* `METRICSD_PREFIX` - metricsd prefix
* `HEROKU_API_KEY` - Heroku API key
* `APPS` - space-delimited list of Heroku apps to track

## Running Locally

Either provide the above in your environment and run `node index.js` or add
a `.env` and start with `foreman start`.

To see what values are being set, set `METRICSD_HOST` to `localhost` and run
`while true; do nc -l -u -w 0 8125; done`.

## TODO

* Write gauge values directly to Graphite (to avoid ghost values, which are
  more acute when dynos idle)
* Track memory usage, etc. on more than one dyno
