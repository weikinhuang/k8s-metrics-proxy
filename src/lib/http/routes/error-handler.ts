import { STATUS_CODES } from 'http';
import logger from '../../logger';
import { NotFound, HttpError } from 'http-errors';
import { Request, Response, NextFunction } from 'express';

interface ErrorResponse {
  message: string;
  status: number;
  statusText: string;
  stack?: string;
}

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(new NotFound());
}

/* eslint-disable @typescript-eslint/no-unused-vars */
export function renderError(err: HttpError, _req: Request, res: Response, _next: NextFunction): void {
  const renderData: ErrorResponse = {
    message: err.message,
    status: err.statusCode || 500,
    statusText: STATUS_CODES[err.statusCode || 500] || 'Unknown Error',
  };
  res.status(err.statusCode || 500);
  logger.error({ channel: 'http', statusCode: err.statusCode || 500, message: err.message, stack: err.stack });

  // development error handler: will print stacktrace
  // production error handler: no stacktraces leaked to user
  if (process.env.NODE_ENV === 'development') {
    /* istanbul ignore next */
    renderData.stack = err.stack;
  }
  res.json({
    error: renderData,
  });
}
