import 'source-map-support/register';
import main from './app';
import logger from './lib/logger';

main().catch((e) => {
  logger.error({ channel: 'global', message: e.message, stack: e.stack });
  process.exit(1); // eslint-disable-line no-process-exit
});
