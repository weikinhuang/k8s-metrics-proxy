import * as http from 'http';
import logger from './lib/logger';
import app from './lib/http/app';
import { port } from './lib/config';

export default async function main(): Promise<void> {
  // start the webserver
  const httpApp = app();
  const server = http.createServer(httpApp);
  server.listen(port, () => {
    logger.notice({ channel: 'global', message: `application ready on port ${port}` });
  });
}
