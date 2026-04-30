import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('🔧 Starting NMSL Healthcare API...');
    logger.log(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
    logger.log(`📍 PORT: ${process.env.PORT || 8000}`);
    
    // Detect outbound IP for firewall whitelisting
    try {
      const https = await import('https');
      const ipDetection = new Promise<string>((resolve, reject) => {
        https.get('https://api.ipify.org?format=json', (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            try {
              const ip = JSON.parse(data).ip;
              resolve(ip);
            } catch {
              reject(new Error('Failed to parse IP'));
            }
          });
        }).on('error', reject);
      });
      
      const outboundIP = await Promise.race([
        ipDetection,
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        ),
      ]);
      
      logger.log(`🌐 OUTBOUND IP ADDRESS: ${outboundIP}`);
      logger.log(`📝 Add this IP to Azure PostgreSQL firewall!`);
    } catch (ipError) {
      logger.warn('⚠️  Could not detect outbound IP');
    }
    
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    logger.log('✅ Application context created successfully');

  // Increase body size limit for base64 image uploads (50MB)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS - Whitelist frontend domains
  const frontendUrls = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = frontendUrls.split(',').map(url => url.trim());
  
  logger.log(`🌐 Allowed CORS origins: ${JSON.stringify(allowedOrigins)}`);
  
  app.enableCors({
    origin: allowedOrigins,
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';
    
    logger.error('❌ Failed to start application:', errorMessage);
    if (errorStack) {
      logger.error('Stack trace:', errorStack);
    }
    
    if (errorMessage.includes('connect ETIMEDOUT') || errorMessage.includes('ECONNREFUSED')) {
      logger.error('🔌 Database connection error detected!');
      logger.error('Please verify:');
      logger.error('  1. DATABASE_HOST is correct and accessible');
      logger.error('  2. DATABASE_PORT is open (default: 5432)');
      logger.error('  3. Firewall/security groups allow connections');
      logger.error('  4. Database credentials are correct');
      logger.error('  5. SSL settings match server requirements');
    }
    
    process.exit(1);
  }
}

bootstrap();
