import { Router, Request, Response } from 'express';

const router = Router({ mergeParams: true });
export default router;

router.get('*', (_req: Request, res: Response) => {
  res.status(404).json({
    paths: [
      '/apis',
      '/apis/custom.metrics.k8s.io',
      '/apis/custom.metrics.k8s.io/v1beta1',
      // "/apis/custom.metrics.k8s.io/v1beta2",
      '/healthz',
      '/metrics',
    ],
  });
});
