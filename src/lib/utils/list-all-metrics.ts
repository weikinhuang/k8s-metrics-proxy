import { Request } from 'express';
import { get } from 'https';
import k8s from '@kubernetes-tools/node-kubernetes-protobuf-parser';
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

async function decodeJson(data: string): Promise<V1APIResourceList> {
  return JSON.parse(data);
}

async function decodeProtobuf(data: Buffer): Promise<V1APIResourceList> {
  const unknown = k8s.decodeMessage(data);
  const res = k8s.io.apimachinery.pkg.apis.meta.v1.APIResourceList.decode(unknown.raw);
  return {
    ...res.toJSON(),
    ...unknown.typeMeta,
  } as V1APIResourceList;
}

async function decode(contentType: string, data: Buffer): Promise<V1APIResourceList> {
  if (contentType === 'application/vnd.kubernetes.protobuf') {
    return await decodeProtobuf(data);
  } else if (contentType === 'application/json') {
    return await decodeJson(data.toString('utf8'));
  }
  throw new Error('Unknown content type');
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
        headers: {
          ...headers,
          // Accept: 'application/vnd.kubernetes.protobuf',
          // Accept: 'application/json',
        },
        rejectUnauthorized: false,
        cert: certFile,
        key: certKey,
      },
      (res) => {
        const data: Buffer[] = [];
        res.on('data', (s) => data.push(s));
        res.on('error', reject);
        res.on('end', async () => {
          try {
            const r = await decode(res.headers['content-type'] || '', Buffer.concat(data));
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
  if (req.query && typeof req.query === 'object' && Object.keys(req.query).length > 0) {
    qs = querystring.stringify((req.query as unknown) as Record<string, any>);
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
