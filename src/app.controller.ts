import { Controller, Get, Body, Post, Param, Query } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Post('/connect')
  connect(@Body() body: { url: string }): any {
    return this.appService.connect(body.url);
  }

  @Get('/namespaces')
  getNamespaces(): any {
    return this.appService.getNamespaces();
  }

  @Get(':namespace/sets')
  getSets(@Param('namespace') namespace: string): any {
    return this.appService.getSets(namespace);
  }

  @Get('/keys')
  getKeys(
    @Query('namespace') namespace: string,
    @Query('set') set: string
  ): any {
    return this.appService.getRecordKeys(namespace, set);
  }
}
