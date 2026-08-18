import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get('health')
  health() {
    return this.systemService.health();
  }

  @Get('version')
  version() {
    return this.systemService.version();
  }

  @Get('system/info')
  info() {
    return this.systemService.info();
  }

  @Get('client-config')
  clientConfig() {
    return this.systemService.clientConfig();
  }
}
