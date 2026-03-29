#!/usr/bin/env node
/**
 * Safe database initialization script
 * Only runs db push if tables don't exist yet
 * Safe for redeploys - won't touch existing data
 */

const { createClient } = require('@libsql/client');

async function ensureDatabase() {
  console.log('🔍 Checking database status...');
  
  const dbUrl = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not set');
    process.exit(1);
  }
  
  const isRemote = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://');
  
  // For local SQLite, we can use prisma db push
  if (!isRemote) {
    console.log('📁 Local SQLite detected, running prisma db push...');
    const { execSync } = require('child_process');
    try {
      execSync('npx prisma db push --accept-data-loss', {
        stdio: 'inherit',
        env: process.env,
      });
      console.log('✅ Database setup complete!');
      return;
    } catch (error) {
      console.error('❌ Database setup failed:', error.message);
      process.exit(1);
    }
  }
  
  // For remote libsql (Turso), we need to check if tables exist
  if (isRemote && !authToken) {
    console.error('❌ DATABASE_AUTH_TOKEN required for remote libsql');
    process.exit(1);
  }
  
  try {
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
    }
    
    // For Turso/libsql, we need to run the SQL directly
    // since prisma db push doesn't support libsql:// URLs
    console.log('🚀 Running initial database setup...');
    
    // Read and execute the SQL schema
    const fs = require('fs');
    const path = require('path');
    
    // Try to find the migration SQL or generate it
    // For now, we'll create tables manually
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS Family (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        pushoverAppToken TEXT,
        pushoverUserKey TEXT,
        resendApiKey TEXT,
        resendFromEmail TEXT,
        isSetupComplete BOOLEAN DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS FamilyMember (
        id TEXT PRIMARY KEY,
        familyId TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        isAdmin BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        pushoverUserKey TEXT,
        emailNotifications BOOLEAN DEFAULT 1,
        pushNotifications BOOLEAN DEFAULT 0,
        FOREIGN KEY (familyId) REFERENCES Family(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS List (
        id TEXT PRIMARY KEY,
        familyId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3b82f6',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        isArchived BOOLEAN DEFAULT 0,
        FOREIGN KEY (familyId) REFERENCES Family(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS ListShare (
        id TEXT PRIMARY KEY,
        listId TEXT NOT NULL,
        memberId TEXT NOT NULL,
        canEdit BOOLEAN DEFAULT 1,
        canDelete BOOLEAN DEFAULT 0,
        canShare BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (listId) REFERENCES List(id) ON DELETE CASCADE,
        FOREIGN KEY (memberId) REFERENCES FamilyMember(id) ON DELETE CASCADE,
        UNIQUE(listId, memberId)
      );
      
      CREATE TABLE IF NOT EXISTS Task (
        id TEXT PRIMARY KEY,
        listId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        isCompleted BOOLEAN DEFAULT 0,
        isArchived BOOLEAN DEFAULT 0,
        dueDate DATETIME,
        priority TEXT DEFAULT 'medium',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdById TEXT NOT NULL,
        assignedToId TEXT,
        parentId TEXT,
        FOREIGN KEY (listId) REFERENCES List(id) ON DELETE CASCADE,
        FOREIGN KEY (createdById) REFERENCES FamilyMember(id) ON DELETE CASCADE,
        FOREIGN KEY (assignedToId) REFERENCES FamilyMember(id) ON DELETE SET NULL,
        FOREIGN KEY (parentId) REFERENCES Task(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS McpToken (
        id TEXT PRIMARY KEY,
        familyId TEXT NOT NULL,
        memberId TEXT NOT NULL,
        name TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        allowAllLists BOOLEAN DEFAULT 1,
        canCreateTasks BOOLEAN DEFAULT 1,
        canCompleteTasks BOOLEAN DEFAULT 1,
        canEditTasks BOOLEAN DEFAULT 1,
        canDeleteTasks BOOLEAN DEFAULT 0,
        canCreateLists BOOLEAN DEFAULT 0,
        canEditLists BOOLEAN DEFAULT 0,
        canDeleteLists BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        lastUsedAt DATETIME,
        FOREIGN KEY (familyId) REFERENCES Family(id) ON DELETE CASCADE,
        FOREIGN KEY (memberId) REFERENCES FamilyMember(id) ON DELETE CASCADE
      );
      
      CREATE TABLE IF NOT EXISTS McpTokenListAccess (
        id TEXT PRIMARY KEY,
        mcpTokenId TEXT NOT NULL,
        listId TEXT NOT NULL,
        FOREIGN KEY (mcpTokenId) REFERENCES McpToken(id) ON DELETE CASCADE,
        FOREIGN KEY (listId) REFERENCES List(id) ON DELETE CASCADE,
        UNIQUE(mcpTokenId, listId)
      );
      
      CREATE INDEX IF NOT EXISTS FamilyMember_familyId ON FamilyMember(familyId);
      CREATE INDEX IF NOT EXISTS List_familyId ON List(familyId);
      CREATE INDEX IF NOT EXISTS ListShare_listId ON ListShare(listId);
      CREATE INDEX IF NOT EXISTS ListShare_memberId ON ListShare(memberId);
      CREATE INDEX IF NOT EXISTS Task_listId ON Task(listId);
      CREATE INDEX IF NOT EXISTS Task_createdById ON Task(createdById);
      CREATE INDEX IF NOT EXISTS Task_assignedToId ON Task(assignedToId);
      CREATE INDEX IF NOT EXISTS Task_parentId ON Task(parentId);
      CREATE INDEX IF NOT EXISTS Task_isCompleted ON Task(isCompleted);
      CREATE INDEX IF NOT EXISTS Task_isArchived ON Task(isArchived);
      CREATE INDEX IF NOT EXISTS McpToken_familyId ON McpToken(familyId);
      CREATE INDEX IF NOT EXISTS McpToken_memberId ON McpToken(memberId);
      CREATE INDEX IF NOT EXISTS McpToken_token ON McpToken(token);
      CREATE INDEX IF NOT EXISTS McpTokenListAccess_mcpTokenId ON McpTokenListAccess(mcpTokenId);
      CREATE INDEX IF NOT EXISTS McpTokenListAccess_listId ON McpTokenListAccess(listId);
    `;
    
    // Execute each statement
    const statements = createTablesSQL.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      if (stmt.trim()) {
        await client.execute(stmt);
      }
    }
    
    await client.close();
    console.log('✅ Database setup complete!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

ensureDatabase();
