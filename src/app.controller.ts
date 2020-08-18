import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { LoggingService } from './utils/logging/logging.service';
import { Constants } from './utils/constants.utils';

@Controller()
export class AppController {
  protected log;

  constructor(
    logger: LoggingService,
    private readonly appService: AppService,
  ) {
    this.log = logger.getLogger('AppController');
  }

  @Post('/connect')
  async connect(
    @Headers(Constants.correlationId) uuid: string,
    @Body() body: { url: string },
  ): Promise<any> {
    this.log.debug({ uuid }, `Received connect to url ${body.url}`);
    return this.appService.connect(body.url, uuid);
  }

  @Get('/namespaces')
  getNamespaces(
    @Headers(Constants.correlationId) uuid: string,
  ): any {
    this.log.debug({ uuid }, `Received getNamespaces`);
    return this.appService.getNamespaces();
  }

  @Get(':namespace/sets')
  getSets(
    @Headers(Constants.correlationId) uuid: string,
    @Param('namespace') namespace: string,
  ): any {
    this.log.debug({ uuid }, `Received getSets for namespace ${namespace}`);
    return this.appService.getSets(namespace);
  }

  @Get('/keys')
  getKeys(
    @Headers(Constants.correlationId) uuid: string,
    @Query('namespace') namespace: string,
    @Query('set') set: string,
  ): any {
    this.log.debug({ uuid }, `Received getKeys for namespace ${namespace} and set ${set}`);
    return this.appService.getRecordKeys(namespace, set);
  }
}
