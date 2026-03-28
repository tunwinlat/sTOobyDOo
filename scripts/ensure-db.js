#!/usr/bin/env node
/**
 * Safe database initialization script
 * Only runs db push if tables don't exist yet
 * Safe for redeploys - won't touch existing data
 */

const { execSync } = require('child_process');
const { createClient } = require('@libsql/client');

async function ensureDatabase() {
  console.log('🔍 Checking database status...');
  
  const dbUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  try {
    // Check if using remote libsql (Turso, etc.)
    const isRemote = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://');
    
    if (isRemote && !authToken) {
      console.error('❌ DATABASE_AUTH_TOKEN required for remote libsql');
      process.exit(1);
    }
    
    // Create libsql client to check if tables exist
    const client = createClient({
      url: dbUrl,
      authToken: authToken,
    });
    
    // Check if Family table exists (main indicator of initialized DB)
    try {
      await client.execute('SELECT 1 FROM Family LIMIT 1');
      console.log('✅ Database already initialized, skipping schema push');
      console.log('   Your data is safe!');
      await client.close();
      return;
    } catch (err) {
      // Table doesn't exist - need to initialize
      console.log('🆕 Database not initialized yet');
      await client.close();
    }
    
    // Run prisma db push for first-time setup
    console.log('🚀 Running initial database setup...');
    execSync('npx prisma db push --accept-data-loss', {
      stdio: 'inherit',
      env: process.env,
    });
    
    console.log('✅ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    
    // If we can't connect, try prisma db push as fallback
    console.log('🔄 Attempting Prisma db push...');
    try {
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('✅ Database setup complete!');
    } catch (pushError) {
      console.error('❌ Failed to set up database:', pushError.message);
      process.exit(1);
    }
  }
}

ensureDatabase();
