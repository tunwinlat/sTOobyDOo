import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  
  // Check if using remote libsql (Turso, Bunny, etc.)
  if (databaseUrl?.startsWith('libsql://') || databaseUrl?.startsWith('https://')) {
    const adapter = new PrismaLibSql({
      url: databaseUrl,
      authToken: authToken,
    });
    return new PrismaClient({ adapter });
  }
  
  // For local SQLite (file:./dev.db)
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
