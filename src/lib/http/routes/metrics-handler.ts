import { Router, Request, Response, NextFunction } from 'express';
import { listAllMetrics } from '../../utils/list-all-metrics';
import { HEALTHCHECK_UA } from '../../config';

const router = Router({ mergeParams: true });
export default router;

router.get('/openapi/v2', (_req: Request, res: Response) => {
  // not implemented
  res.status(404).json({});
});

router.head('/apis/custom.metrics.k8s.io/v1beta1', async (_req: Request, res: Response) => {
  res.status(200).end();
});

router.get('/apis/custom.metrics.k8s.io/v1beta1', async (req: Request, res: Response, next: NextFunction) => {
  // if we're just trying to get a readiness check from apiserver
  if (HEALTHCHECK_UA.test(req.get('user-agent') || '') && !req.query.timeout) {
    res.status(200).json({});
    return;
  }
  try {
    const stats = await listAllMetrics(req);
    res.setHeader('Cache-Control', 'no-cache, private');
    res.status(200).json(stats);
  } catch (e) {
    next(e);
  }
});
