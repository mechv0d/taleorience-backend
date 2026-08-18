import { Controller, Get, Param } from '@nestjs/common';
import { LocalizationService } from './localization.service';

@Controller('system/locales')
export class LocalizationController {
  constructor(private readonly localizationService: LocalizationService) {}

  @Get()
  manifest() {
    return this.localizationService.getManifest();
  }

  @Get(':locale/:namespace')
  namespace(
    @Param('locale') locale: string,
    @Param('namespace') namespace: string,
  ) {
    return this.localizationService.getNamespace(locale, namespace);
  }
}
