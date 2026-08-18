import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.schema';
import { AppConfigModule } from './config/app-config.module';
import { SystemModule } from './system/system.module';
import { LocalizationModule } from './localization/localization.module';
import { ProblemJsonFilter } from './common/filters/problem-json.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    AppConfigModule,
    SystemModule,
    LocalizationModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ProblemJsonFilter,
    },
  ],
})
export class AppModule {}
