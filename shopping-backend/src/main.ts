import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { getEnv } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '12mb' }));
  app.useGlobalPipes(new ValidationPipe());

  const corsOrigins = getEnv('CORS_ORIGIN', 'http://localhost:8081,http://localhost:19006')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  await app.listen(4000, '0.0.0.0');
}
bootstrap();
