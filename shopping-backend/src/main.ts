import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(json({ limit: '12mb' }));
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.listen(4000, '0.0.0.0');
}
bootstrap();
