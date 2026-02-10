import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';
import { Logger } from '@nestjs/common';

process.env.TZ = 'Africa/Nairobi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // === BODY SIZE LIMIT (IMPORTANT FOR ATTACHMENTS) ===
  app.use(bodyParser.json({ limit: '25mb' }));
  app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));

  app.useLogger(new Logger());

  // === ENABLE CORS ===
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://unified-notifications-admin.vercel.app',
      'https://v0-imflow-website-design.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // === GLOBAL VALIDATION ===
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3040;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 NotifyHub backend running on port ${port} (TZ: ${process.env.TZ})`);
}

bootstrap();
