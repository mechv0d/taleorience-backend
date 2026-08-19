import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PersistenceModule } from '../../persistence/persistence.module';
import { AssetsController } from './assets.controller';

@Module({
  imports: [DatabaseModule, PersistenceModule],
  controllers: [AssetsController],
})
export class AssetsModule {}
