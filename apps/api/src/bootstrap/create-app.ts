import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyMultipart from '@fastify/multipart';
import fastifyCors from '@fastify/cors';
import { AppModule } from '../app.module';
import { AppConfigService } from '../config/app-config.service';

const BODY_LIMIT = 20 * 1024 * 1024;

export async function createApp(): Promise<NestFastifyApplication> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, bodyLimit: BODY_LIMIT }),
  );

  const config = app.get(AppConfigService);

  await app.register(fastifyMultipart);
  await app.register(fastifyCors, {
    origin: config.corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  return app;
}
