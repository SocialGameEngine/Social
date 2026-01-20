#!/usr/bin/env node

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const USER_COUNT = parseInt(process.argv[2] || '3');

console.log(`🎭 Playwright Multi-User Test`);
console.log(`📍 Server: ${BASE_URL}`);
console.log(`👥 Users: ${USER_COUNT}`);
console.log(`🔒 Each user has completely isolated session\n`);

async function runMultiUserTest() {
  console.log('🚀 Starting multi-user simulation...\n');

  // Use playwright test with the isolation test file
  const testCommand = `npx playwright test multi-user-isolation.spec.ts --headed --workers=${USER_COUNT}`;

  console.log(`Running: ${testCommand}\n`);

  return new Promise((resolve, reject) => {
    const testProcess = exec(testCommand, {
      cwd: join(__dirname, '..'),
      env: {
        ...process.env,
        BASE_URL,
      },
      stdio: 'inherit',
      shell: true
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Multi-user test completed successfully!');
        resolve();
      } else {
        console.log(`\n❌ Test failed with exit code: ${code}`);
        reject(new Error(`Test failed with exit code: ${code}`));
      }
    });

    testProcess.on('error', reject);
  });
}

runMultiUserTest().catch(console.error);