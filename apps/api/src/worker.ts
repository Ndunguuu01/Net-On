// ============================================
// Net-On API — Background Queue Worker Entry Point
// ============================================
// Processes asynchronous BullMQ jobs: network router
// sync, automated billing batches, and SMS dispatches.
// ============================================

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { SubscriptionCronService } from './modules/subscription/services/subscription-cron.service';
import { TokenService } from './modules/auth/services/token.service';

async function bootstrapWorker() {
  const logger = new Logger('QueueWorker');

  logger.log('Initializing Net-On Background Worker...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const cronService = app.get(SubscriptionCronService);
  const tokenService = app.get(TokenService);

  logger.log('═══════════════════════════════════════════════');
  logger.log('   ⚙️  Net-On Background Queue Worker');
  logger.log('   🚀 Worker online & listening for scheduled jobs');
  logger.log('═══════════════════════════════════════════════');

  // Run periodic cleanup task every hour
  const cleanupInterval = setInterval(async () => {
    try {
      const revokedCount = await tokenService.cleanupExpiredTokens();
      if (revokedCount > 0) {
        logger.log(`[Worker] Cleaned up ${revokedCount} expired/revoked refresh tokens.`);
      }
    } catch (err: any) {
      logger.error(`[Worker] Token cleanup failed: ${err.message}`);
    }
  }, 60 * 60 * 1000);

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    logger.log(`Received ${signal}. Shutting down worker gracefully...`);
    clearInterval(cleanupInterval);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrapWorker().catch((err) => {
  console.error('Fatal error starting Net-On background worker:', err);
  process.exit(1);
});
