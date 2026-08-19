import { Module, Global } from '@nestjs/common';
import {
  createDatabaseConnection,
  Db,
  PgDb,
} from '@taleorience/infrastructure';
import { AppConfigService } from '../config/app-config.service';
import { DB_CONNECTION } from '../modules/tokens';

export type DatabaseConnection = Db | PgDb;

@Global()
@Module({
  providers: [
    {
      provide: DB_CONNECTION,
      inject: [AppConfigService],
      useFactory: async (
        config: AppConfigService,
      ): Promise<DatabaseConnection> => {
        if (config.databaseProvider === 'postgres') {
          return createDatabaseConnection({
            provider: 'postgres',
            databaseUrl: config.databaseUrl,
          });
        }

        return createDatabaseConnection({
          provider: 'sqlite',
          databasePath: config.sqliteDatabasePath,
          isTest: process.env.NODE_ENV === 'test',
        });
      },
    },
  ],
  exports: [DB_CONNECTION],
})
export class DatabaseModule {}
