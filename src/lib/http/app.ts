import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import routes from './routes';
import { renderError } from './routes/error-handler';
import { HEALTHCHECK_UA } from '../config';

export default function(): express.Express {
  // configure the express app
  const app = express();

  // trust proxies
  app.set('trust proxy', true);

  // pretty print json in dev
  if (process.env.NODE_ENV !== 'production') {
    /* istanbul ignore next */
    app.set('json spaces', 4);
  }

  // disable x-powered-by header
  app.set('x-powered-by', false);

  // configure logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(
      morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
        skip(req) {
          // if we're just trying to get a readiness check from apiserver
          if (HEALTHCHECK_UA.test(req.get('user-agent') || '') && !req.query.timeout) {
            return true;
          }
          // filter out requests to the healthz and metrics endpoint
          if (/^\/(healthz)/.test(req.originalUrl)) {
            return true;
          }

          return false;
        },
      }),
    );
  }

  // configure compression
  app.use(compression());

  // setup all routes
  app.use(routes());

  // configure general error handler
  app.use(renderError);

  return app;
}
