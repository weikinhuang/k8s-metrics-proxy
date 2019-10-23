import { Router, Request, Response, NextFunction } from 'express';
import k8s from '@kubernetes-tools/node-kubernetes-protobuf-parser';
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
  const accept = (req.get('accept') || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  try {
    const stats = await listAllMetrics(req);
    res.setHeader('Cache-Control', 'no-cache, private');
    res.status(200);
    if (accept.includes('application/vnd.kubernetes.protobuf')) {
      res.setHeader('Content-Type', 'application/vnd.kubernetes.protobuf');
      res.write(k8s.encodeMessage(k8s.io.apimachinery.pkg.apis.meta.v1.APIResourceList, stats));
      res.end();
    } else {
      res.json(stats);
    }
  } catch (e) {
    next(e);
  }
});
