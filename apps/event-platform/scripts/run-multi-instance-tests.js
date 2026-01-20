#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const INSTANCE_COUNT = process.argv[2] ? parseInt(process.argv[2]) : 3;
const BASE_PORT = 5173;
const TEST_COMMAND = process.argv[3] || 'playwright test';

console.log(`🚀 Running ${INSTANCE_COUNT} instances of event-platform with Playwright tests`);
console.log(`📍 Base port: ${BASE_PORT}`);
console.log(`🧪 Test command: ${TEST_COMMAND}\n`);

// Start multiple instances
async function startInstances() {
  console.log('Starting dev servers...');
  const instanceProcess = spawn('node', ['scripts/run-multi-instances.js', INSTANCE_COUNT.toString()], {
    cwd: join(__dirname, '..'),
    stdio: ['inherit', 'pipe', 'inherit']
  });

  return new Promise((resolve, reject) => {
    let output = '';
    let readyCount = 0;

    instanceProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;

      if (text.includes('is ready!')) {
        readyCount++;
        console.log(`✅ Instance ${readyCount}/${INSTANCE_COUNT} ready`);

        if (readyCount === INSTANCE_COUNT) {
          console.log('\n🎉 All instances are ready! Starting tests...\n');
          resolve(instanceProcess);
        }
      }
    });

    instanceProcess.on('error', reject);

    // Timeout after 60 seconds
    setTimeout(() => {
      instanceProcess.kill();
      reject(new Error('Timeout waiting for instances to start'));
    }, 60000);
  });
}

// Run tests across all instances
async function runTests() {
  const env = {
    ...process.env,
    BASE_PORT: BASE_PORT.toString(),
    INSTANCE_COUNT: INSTANCE_COUNT.toString(),
  };

  console.log('Running Playwright tests across all instances...');

  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', TEST_COMMAND.split(' '), {
      cwd: join(__dirname, '..'),
      env,
      stdio: 'inherit'
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ All tests passed!');
        resolve();
      } else {
        console.log(`\n❌ Tests failed with exit code: ${code}`);
        reject(new Error(`Tests failed with exit code: ${code}`));
      }
    });

    testProcess.on('error', reject);
  });
}

// Main execution
async function main() {
  let instanceProcess;

  try {
    // Start instances
    instanceProcess = await startInstances();

    // Run tests
    await runTests();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Clean up instances
    if (instanceProcess) {
      console.log('\n🧹 Cleaning up instances...');
      instanceProcess.kill();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  process.exit(0);
});

main();