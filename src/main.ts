// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === BODY SIZE LIMIT (IMPORTANT FOR ATTACHMENTS) ===
  app.use(bodyParser.json({ limit: '25mb' }));
  app.use(bodyParser.urlencoded({ limit: '25mb', extended: true }));

  // === ENABLE CORS ===
  app.enableCors({
    origin: [
      'http://localhost:3000', // For when frontend and backend on same port (rare)
      'http://localhost:3001', // Common Next.js dev port
      'http://localhost:3002',
      'https://api-unifiednotifications.onrender.com', // Replace with your actual Vercel URL later
      'https://notifyhub.vercel.app', // Example production domain
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Important if using cookies/sessions later
  });

  // === GLOBAL VALIDATION ===
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // 🔒 strips unknown fields
      forbidNonWhitelisted: false, // set true later if you want strict mode
    }),
  );

  const port = process.env.PORT || 3040;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 NotifyHub backend running on port ${port}`);
}

bootstrap();
