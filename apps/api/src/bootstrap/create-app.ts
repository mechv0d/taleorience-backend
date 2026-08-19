import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyMultipart from '@fastify/multipart';
import { AppModule } from '../app.module';

const BODY_LIMIT = 20 * 1024 * 1024;

export async function createApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, bodyLimit: BODY_LIMIT }),
  );

  await app.register(fastifyMultipart);

  app.setGlobalPrefix('api/v1');

  return app;
}
