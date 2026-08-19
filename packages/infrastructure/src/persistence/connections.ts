import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import postgres from 'postgres';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import * as sqliteSchema from './schema';
import * as pgSchema from './schema-pg';
import { SQLITE_SCHEMA_DDL, POSTGRES_SCHEMA_DDL } from './ddl';
import { Db } from './repositories';
import { PgDb } from './repositories-pg';

export type DatabaseProvider = 'sqlite' | 'postgres';

export interface SqliteConnectionOptions {
  provider: 'sqlite';
  databasePath: string;
  isTest?: boolean;
}

export interface PostgresConnectionOptions {
  provider: 'postgres';
  databaseUrl: string;
}

export type ConnectionOptions = SqliteConnectionOptions | PostgresConnectionOptions;

export async function createDatabaseConnection(
  options: ConnectionOptions,
): Promise<Db | PgDb> {
  if (options.provider === 'postgres') {
    return createPostgresConnection(options.databaseUrl);
  }
  return createSqliteConnection(options.databasePath, options.isTest);
}

export function createSqliteConnection(
  databasePath: string,
  isTest = false,
): Db {
  const sqlite = new Database(isTest ? ':memory:' : databasePath);
  sqlite.exec(SQLITE_SCHEMA_DDL);
  return drizzle(sqlite, { schema: sqliteSchema });
}

export async function createPostgresConnection(databaseUrl: string): Promise<PgDb> {
  const client = postgres(databaseUrl);
  await client.unsafe(POSTGRES_SCHEMA_DDL);
  return drizzlePg(client, { schema: pgSchema });
}