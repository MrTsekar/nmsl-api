import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS - Support multiple frontend URLs
  const frontendUrls = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = frontendUrls.split(',').map(url => url.trim());
  
  logger.log(`🌐 Allowed CORS origins: ${JSON.stringify(allowedOrigins)}`);
  
  app.enableCors({
    origin: function(origin, callback) {
      // Allow requests with no origin (mobile apps, Postman, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      
      // Check if the origin is in our allowed list
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn(`❌ Blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('NMSL Portal API')
    .setDescription(
      'Comprehensive healthcare management system API for Nigerian Medical Services Limited (NMSL).\n\n' +
      '**Base URL:** `/api/v1`\n\n' +
      '**Key Features:**\n' +
      '- JWT Authentication & Authorization\n' +
      '- Role-Based Access Control (Admin, Appointment Officer, Patient, Doctor)\n' +
      '- Appointment Locking System with Redis\n' +
      '- Comprehensive Audit Trail\n' +
      '- Real-time Chat & Notifications\n' +
      '- Medical Records Management\n\n' +
      '**Roles:**\n' +
      '- `admin` - Full system access\n' +
      '- `appointment_officer` - Process appointments with exclusive locks\n' +
      '- `doctor` - Manage consultations and appointments\n' +
      '- `patient` - Book appointments and access medical records',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Admin', 'Admin management endpoints')
    .addTag('Doctors', 'Doctor management')
    .addTag('Appointments', 'Appointment management')
    .addTag('Audit', 'Audit logs and statistics')
    .addTag('Services', 'Medical services catalog')
    .addTag('Partners', 'Trusted partners')
    .addTag('Board Members', 'Board of directors')
    .addTag('Contact', 'Contact information')
    .addTag('Statistics', 'Homepage statistics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 8000;
  await app.listen(port);

  logger.log(`🚀 NMSL Healthcare API running on http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
