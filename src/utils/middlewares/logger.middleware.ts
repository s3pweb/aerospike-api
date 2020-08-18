import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { Constants } from '../constants.utils';
import { LoggingService } from '../logging/logging.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly log;

  constructor(logger: LoggingService) {
    this.log = logger.getLogger('RequestTracker');
  }

  use(req: Request, res: Response, next: () => void): void {
    const start = process.hrtime();
    const uuid: string = req.headers[Constants.correlationId]?.toString();

    res.once('finish', () => {
      const diff = process.hrtime(start);
      const responseTimeInMs = diff[0] * 1e3 + diff[1] * 1e-6;

      // metrics route is excluded to reduce log and prometheus spam
      this.log.info({ uuid }, `${req.method} ${req.originalUrl}, HTTP ${res.statusCode}, Request total time ${responseTimeInMs.toFixed(2)} ms.`);

      // Log more data if we send back an error
      if (res.statusCode >= 400) {
        const failedRequest = {
          headers: req.headers,
          query: req.query,
          params: req.params,
          body: req.body,
        };
        this.log.warn({ uuid }, `Failed request: ${JSON.stringify(failedRequest, null, 2)}`);
      }
    });

    next();
  }
}
