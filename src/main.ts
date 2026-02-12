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
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://unified-notifications-admin.vercel.app',
    'https://uniflow-admin.vercel.app', // new admin vercel url
    'https://uniflow-client.vercel.app',// new client vercel url
    'https://v0-imflow-website-design.vercel.app',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., server-to-server API calls, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow whitelisted dashboard origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Block unknown browser origins (API key users use server-to-server, not browser)
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'UNIFIED-API-Key'],
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
