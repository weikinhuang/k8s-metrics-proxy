import { Request } from 'express';
import { get } from 'https';
import * as querystring from 'querystring';
import { certFile, certKey, metricsServers } from '../config';
import { IncomingHttpHeaders } from 'http';

interface V1APIResource {
  name: string;
  singularName: string;
  namespaced: boolean;
  kind: 'MetricValueList';
  verbs: string[];
}

interface V1APIResourceList {
  kind: 'APIResourceList';
  apiVersion: 'v1';
  groupVersion: 'custom.metrics.k8s.io/v1beta1';
  resources: V1APIResource[];
}

export interface MetricsProvider {
  name: string;
  serviceName: string;
  serviceNamespace: string;
  targetPort: string;
  pathMatch: string;
}

function listMetricsFromServer(
  qs: string,
  headers: IncomingHttpHeaders,
  provider: MetricsProvider,
): Promise<V1APIResourceList> {
  return new Promise<V1APIResourceList>((resolve, reject) => {
    get(
      `https://${provider.serviceName}.${provider.serviceNamespace}.svc.cluster.local:${
        provider.targetPort
      }/apis/custom.metrics.k8s.io/v1beta1${qs ? `?${qs}` : ''}`,
      {
        headers,
        rejectUnauthorized: false,
        cert: certFile,
        key: certKey,
      },
      (res) => {
        let data = '';
        res.on('data', (s) => (data += s));
        res.on('error', reject);
        res.on('end', () => {
          try {
            const r = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(r);
            } else {
              reject(r);
            }
          } catch (e) {
            reject(e);
          }
        });
      },
    ).on('error', reject);
  });
}

function extractMetricsResources(data: V1APIResourceList | null): V1APIResource[] {
  if (!data || data.kind !== 'APIResourceList' || !Array.isArray(data.resources)) {
    return [];
  }
  return data.resources;
}

export async function listAllMetrics(req: Request): Promise<any> {
  const resources: V1APIResource[] = [];

  let qs = '';
  if (req.query && Object.keys(req.query).length > 0) {
    qs = querystring.stringify(req.query);
  }

  const metrics = metricsServers.map((provider) => {
    return listMetricsFromServer(qs, { ...req.headers }, provider).catch(() => {
      return null;
    });
  });
  const allMetrics = await Promise.all(metrics);
  allMetrics.map(extractMetricsResources).forEach((resourceList) => resources.push(...resourceList));

  const res: V1APIResourceList = {
    kind: 'APIResourceList',
    apiVersion: 'v1',
    groupVersion: 'custom.metrics.k8s.io/v1beta1',
    resources,
  };

  return res;
}
