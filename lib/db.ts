import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  
  // Check if using remote libsql (Turso, Bunny, etc.)
  if (databaseUrl?.startsWith('libsql://') || databaseUrl?.startsWith('https://')) {
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    
    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }
  
  // For local SQLite (file:./dev.db)
  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
