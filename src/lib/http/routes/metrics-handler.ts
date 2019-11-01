import { Router, Request, Response, NextFunction } from 'express';
import k8s from '@kubernetes-tools/node-kubernetes-protobuf-parser';
import { listAllMetrics } from '../../utils/list-all-metrics';
import { HEALTHCHECK_UA } from '../../config';

const router = Router({ mergeParams: true });
export default router;

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const data = {
    kind: 'APIGroupList',
    apiVersion: 'v1',
    groups: [
      {
        name: 'custom.metrics.k8s.io',
        versions: [
          {
            groupVersion: 'custom.metrics.k8s.io/v1beta1',
            version: 'v1beta1',
          },
        ],
        preferredVersion: {
          groupVersion: 'custom.metrics.k8s.io/v1beta1',
          version: 'v1beta1',
        },
        serverAddressByClientCIDRs: [
          {
            clientCIDR: '0.0.0.0/0',
            serverAddress: ':8443',
          },
        ],
      },
    ],
  };

  const accept = (req.get('accept') || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  try {
    res.setHeader('Cache-Control', 'no-cache, private');
    res.status(200);
    if (accept.includes('application/vnd.kubernetes.protobuf')) {
      res.setHeader('Content-Type', 'application/vnd.kubernetes.protobuf');
      res.write(k8s.encodeMessage(k8s.io.apimachinery.pkg.apis.meta.v1.APIGroupList, data));
      res.end();
    } else {
      res.json(data);
    }
  } catch (e) {
    next(e);
  }
});

router.get('/custom.metrics.k8s.io', async (req: Request, res: Response, next: NextFunction) => {
  const data = {
    kind: 'APIGroup',
    apiVersion: 'v1',
    name: 'custom.metrics.k8s.io',
    versions: [
      {
        groupVersion: 'custom.metrics.k8s.io/v1beta1',
        version: 'v1beta1',
      },
    ],
    preferredVersion: {
      groupVersion: 'custom.metrics.k8s.io/v1beta1',
      version: 'v1beta1',
    },
  };

  const accept = (req.get('accept') || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  try {
    res.setHeader('Cache-Control', 'no-cache, private');
    res.status(200);
    if (accept.includes('application/vnd.kubernetes.protobuf')) {
      res.setHeader('Content-Type', 'application/vnd.kubernetes.protobuf');
      res.write(k8s.encodeMessage(k8s.io.apimachinery.pkg.apis.meta.v1.APIGroup, data));
      res.end();
    } else {
      res.json(data);
    }
  } catch (e) {
    next(e);
  }
});

router.head('/custom.metrics.k8s.io/v1beta1', async (_req: Request, res: Response) => {
  res.status(200).end();
});

router.head('/custom.metrics.k8s.io/v1beta2', async (_req: Request, res: Response) => {
  res.status(200).end();
});

router.get('/custom.metrics.k8s.io/v1beta1', async (req: Request, res: Response, next: NextFunction) => {
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
