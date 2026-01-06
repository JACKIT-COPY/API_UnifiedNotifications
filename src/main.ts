// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === ENABLE CORS ===
  app.enableCors({
    origin: [
      'http://localhost:3000',     // For when frontend and backend on same port (rare)
      'http://localhost:3001',     // Common Next.js dev port
      'http://localhost:3002',
      'https://your-frontend-domain.vercel.app', // Replace with your actual Vercel URL later
      'https://notifyhub.vercel.app',           // Example production domain
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Important if using cookies/sessions later
  });

  // Global validation pipe (already likely there)
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  await app.listen(3040);
  console.log('🚀 NotifyHub backend running on http://localhost:3040');
}
bootstrap();