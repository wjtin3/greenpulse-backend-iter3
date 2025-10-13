#!/usr/bin/env node

/**
 * Test script for running tests against Vercel database
 * Usage: node scripts/test-vercel.js
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🚀 Running tests against Vercel database...\n');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.log('Please set your Vercel database URL:');
  console.log('export DATABASE_URL="postgresql://username:password@host:port/database"');
  process.exit(1);
}

console.log('✅ DATABASE_URL is configured');
console.log(`📊 Database: ${process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'Unknown'}`);

// Set test environment
process.env.NODE_ENV = 'test';

try {
  console.log('\n🧪 Running unit tests...');
  execSync('npm test', { stdio: 'inherit' });
  
  console.log('\n🔗 Running integration tests...');
  execSync('npx jest tests/integration/', { stdio: 'inherit' });
  
  console.log('\n✅ All tests completed successfully!');
} catch (error) {
  console.error('\n❌ Tests failed:', error.message);
  process.exit(1);
}
