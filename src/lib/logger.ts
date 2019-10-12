import { createLogger, config, format, transports } from 'winston';

const logger = createLogger({
  // @see https://github.com/winstonjs/triple-beam/blob/master/config/syslog.js
  level:
    process.env.LOG_LEVEL && process.env.LOG_LEVEL.toLowerCase() in config.syslog.levels
      ? process.env.LOG_LEVEL.toLowerCase()
      : 'notice',
  levels: config.syslog.levels,
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console({ stderrLevels: ['emerg', 'alert', 'crit', 'error', 'warning'] })],
});

export default logger;
