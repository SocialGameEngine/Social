#!/usr/bin/env node

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USER_COUNT = process.argv[2] ? parseInt(process.argv[2]) : 10;
const BASE_PORT = 5173;
const BASE_URL = `http://localhost:${BASE_PORT}`;

console.log(`🚀 Running multi-user tests: ${USER_COUNT} concurrent users on single server`);
console.log(`📍 Server: ${BASE_URL}\n`);

// Start the dev server
async function startDevServer() {
  console.log('Starting dev server...');

  return new Promise((resolve, reject) => {
    const command = 'pnpm run dev';
    console.log(`Running: ${command} in ${join(__dirname, '..')}`);

    const child = exec(command, {
      cwd: join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverReady = false;

    child.stdout.on('data', (data) => {
      const text = data.toString();
      console.log(`[Server] ${text.trim()}`);

      if (!serverReady && (text.includes('ready in') || text.includes('Local:') || text.includes('running at'))) {
        serverReady = true;
        console.log(`✅ Server ready at ${BASE_URL}\n`);
        resolve(child);
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      console.error(`[Server ERROR] ${text.trim()}`);
    });

    child.on('error', (error) => {
      console.error('Server spawn error:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        child.kill();
        reject(new Error('Server startup timeout'));
      }
    }, 30000);
  });
}

// Run tests with multiple concurrent users
async function runMultiUserTests() {
  const env = {
    ...process.env,
    BASE_URL,
    MULTI_USER: USER_COUNT.toString(),
  };

  console.log(`Running Playwright tests with ${USER_COUNT} concurrent users...`);
  console.log(`All users connecting to single server: ${BASE_URL}`);
  console.log(`Using ${USER_COUNT} parallel workers\n`);

  return new Promise((resolve, reject) => {
    // Use pnpm to run playwright instead of npx
    const pnpmPath = process.platform === 'win32' ? 'C:\\nvm4w\\nodejs\\pnpm.cmd' : 'pnpm';
    const testCommand = `${pnpmPath} exec playwright test --workers=${USER_COUNT} --reporter=line`;

    console.log(`Executing: ${testCommand}\n`);
    console.log(`Environment: BASE_URL=${env.BASE_URL}, MULTI_USER=${env.MULTI_USER}\n`);

    const testProcess = exec(testCommand, {
      cwd: join(__dirname, '..'),
      env,
      stdio: 'inherit', // Show test output directly
      shell: true // Use shell to handle pnpm better
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ All multi-user tests passed!');
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
  let serverProcess;

  try {
    // Start the single dev server
    serverProcess = await startDevServer();

    // Run tests with multiple concurrent users
    await runMultiUserTests();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    // Clean up server
    if (serverProcess) {
      console.log('\n🧹 Shutting down server...');
      serverProcess.kill();
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...');
  process.exit(0);
});

main();