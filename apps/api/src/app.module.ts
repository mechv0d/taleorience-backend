import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.schema';
import { AppConfigModule } from './config/app-config.module';
import { SystemModule } from './system/system.module';
import { LocalizationModule } from './localization/localization.module';
import { DatabaseModule } from './database/database.module';
import { PersistenceModule } from './persistence/persistence.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { WorldModule } from './modules/world/world.module';
import { AssetsModule } from './modules/assets/assets.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { ProblemJsonFilter } from './common/filters/problem-json.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    AppConfigModule,
    DatabaseModule,
    PersistenceModule,
    SystemModule,
    LocalizationModule,
    ProjectsModule,
    WorldModule,
    AssetsModule,
    KnowledgeModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ProblemJsonFilter }],
})
export class AppModule {}
