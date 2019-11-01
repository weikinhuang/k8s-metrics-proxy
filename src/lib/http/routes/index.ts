import { Router } from 'express';
import { notFound } from './error-handler';

// routes
import healthcheckRoute from './healthcheck-handler';
import openapiRoute from './openapi-handler';
import metricsRoute from './metrics-handler';

export default function(): Router {
  const router = Router();

  // no cache for routes
  router.use('/*', (_req, res, next) => {
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
  });

  // healthcheck
  router.use('/healthz', healthcheckRoute);

  // openapi spec
  router.use('/openapi', openapiRoute);

  // prometheus stats
  router.use('/apis', metricsRoute);

  // catch 404 and forward to error handler
  router.use(notFound);

  return router;
}
