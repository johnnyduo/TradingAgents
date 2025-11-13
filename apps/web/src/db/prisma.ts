import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Test connection
prisma.$connect()
  .then(() => {
    logger.info('✅ Database connected successfully');
  })
  .catch((error) => {
    logger.error('❌ Database connection failed:', error);
    logger.warn('⚠️  Server will continue without Prisma database connection');
    logger.info('ℹ️  Using Supabase JS client for database operations');
    // Don't exit - allow server to run with Supabase JS client fallback
  });

export { prisma };
