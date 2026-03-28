#!/usr/bin/env ts-node
/**
 * Database setup script
 * This runs during build to ensure database is initialized
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupDatabase() {
  console.log('🔍 Checking database connection...');
  
  try {
    // Try to query the database
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
    
    // Check if setup is complete
    const family = await prisma.family.findFirst();
    if (family) {
      console.log(`✅ Family "${family.name}" found, database is ready`);
    } else {
      console.log('ℹ️ No family found yet - setup wizard will handle this');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
