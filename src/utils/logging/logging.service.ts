import { Injectable } from '@nestjs/common';
import { logger } from '@s3pweb/s3pweb-logger';

@Injectable()
export class LoggingService {
  protected readonly logger;

  constructor() {
    this.logger = logger.child({ child: 'Main' });
  }

  getLogger(child: string) {
    return this.logger.child({ child });
  }
}
