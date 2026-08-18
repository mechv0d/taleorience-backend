import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // setupNotFoundHandler(app); ← УДАЛИТЬ ЭТУ СТРОКУ

  const config = app.get(AppConfigService);

  const openApiConfig = new DocumentBuilder()
    .setTitle('TaleOrience World Engine API')
    .setDescription('Backend API for TaleOrience World Engine')
    .setVersion(config.appVersion)
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, openApiConfig);

  SwaggerModule.setup('api/v1/docs', app, document, {
    jsonDocumentUrl: 'api/v1/openapi.json',
  });

  await app.listen(config.port, '0.0.0.0');
}

void bootstrap();
