import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createApp } from './bootstrap/create-app';
import { AppConfigService } from './config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await createApp();

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
