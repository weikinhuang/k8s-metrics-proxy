import * as fs from 'fs';
import { MetricsProvider } from './utils/list-all-metrics';

// env vars
const CONFIG_ROOT = process.env.CONFIG_ROOT || './';

// cert
const pem = fs.readFileSync(`${CONFIG_ROOT}/server.pem`, 'utf8');
const keyPart: string = (/(---+BEGIN[ A-Z]+?KEY--+[\s\S]+---+END.+?KEY--+)/s.exec(pem) || [])[1] || '';
const certPart: string = (/(---+BEGIN CERTIFICATE--+[\s\S]+---+END CERTIFICATE--+)/s.exec(pem) || [])[1] || '';

if (!keyPart || !certPart) {
  throw new Error('Invalid certificate');
}
export const certKey = Buffer.from(keyPart);
export const certFile = Buffer.from(certPart);

// checks
export const HEALTHCHECK_UA = /Go-http-client\//;

// operator
export const port = parseInt(process.env.PORT || '8081', 10) || 8081;

// metrics servers
export const metricsServers: MetricsProvider[] = [];
try {
  const config = JSON.parse(fs.readFileSync('/config/servers.json', 'utf8'));
  if (Array.isArray(config)) {
    metricsServers.push(...config);
  }
} catch {
  // empty
}
