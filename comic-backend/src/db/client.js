/**
 * Prisma Database Client
 * Singleton instance for database access
 */

import { PrismaClient } from '@prisma/client';

// Create singleton instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
