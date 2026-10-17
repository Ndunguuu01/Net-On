// ============================================
// Net-On API — Application Entry Point
// ============================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // --- Security ---
  app.use(helmet());

  // --- Global Exception Filter ---
  app.useGlobalFilters(new AllExceptionsFilter());

  // --- Global Response Interceptor ---
  app.useGlobalInterceptors(new TransformInterceptor());

  // --- CORS ---
  app.enableCors({
    origin: process.env.API_CORS_ORIGINS?.split(',') || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // --- Global Prefix ---
  const apiPrefix = process.env.API_PREFIX || 'api/v1';
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['/'],
  });

  // --- Global Validation Pipe ---
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // --- Swagger API Documentation ---
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Net-On API')
      .setDescription('Net-On ISP Management Platform API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'JWT-auth',
      )
      .addTag('Health', 'System health checks')
      .addTag('Auth', 'Authentication and authorization')
      .addTag('Customers', 'Customer management')
      .addTag('Packages', 'Internet package management')
      .addTag('Subscriptions', 'Subscription management')
      .addTag('Invoices', 'Invoice management')
      .addTag('Payments', 'Payment processing')
      .addTag('Network', 'Network account management')
      .addTag('Routers', 'MikroTik router management')
      .addTag('Notifications', 'Notification management')
      .addTag('Reports', 'Business reports')
      .addTag('Support', 'Support tickets')
      .addTag('Staff', 'Staff management')
      .addTag('Audit', 'Audit logs')
      .addTag('Settings', 'System settings')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log(`Swagger docs available at http://localhost:${process.env.API_PORT || 3001}/api/docs`);
  }

  // --- Start Server ---
  const port = process.env.API_PORT || 3001;
  await app.listen(port);

  logger.log('');
  logger.log('═══════════════════════════════════════════════');
  logger.log('   🌐 Net-On ISP Management Platform API');
  logger.log(`   🚀 Server running on http://localhost:${port}`);
  logger.log(`   📋 API prefix: /${apiPrefix}`);
  logger.log(`   📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.log('═══════════════════════════════════════════════');
  logger.log('');
}

bootstrap();
