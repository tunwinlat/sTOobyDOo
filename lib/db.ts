import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// For libsql support (Turso, Bunny, etc.)
function getPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  
  // If using libsql remote URL (Turso, etc.)
  if (databaseUrl?.startsWith('libsql://') || databaseUrl?.startsWith('https://')) {
    // Create libsql client with auth token
    const libsqlClient = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    
    // For Prisma with libsql, we use the standard client
    // Prisma will use the DATABASE_URL directly
    return new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
  }
  
  // For local SQLite (file:./dev.db)
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
