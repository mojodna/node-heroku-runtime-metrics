# node-heroku-metricsd-bridge

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
