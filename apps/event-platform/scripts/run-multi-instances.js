#!/usr/bin/env node

import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_PORT = 5173;
const INSTANCE_COUNT = process.argv[2] ? parseInt(process.argv[2]) : 10;

console.log(`Starting ${INSTANCE_COUNT} instances of event-platform...`);

const instances = [];

function startInstance(port) {
  return new Promise((resolve, reject) => {
    console.log(`Starting instance on port ${port}...`);

    const env = {
      ...process.env,
      PORT: port.toString(),
      VITE_USE_E2E_MOCKS: process.env.VITE_USE_E2E_MOCKS || 'false'
    };

    // Use exec for better Windows compatibility
    const command = `pnpm run dev --port ${port} --host`;
    console.log(`Running: ${command} in ${join(__dirname, '..')}`);

    const child = exec(command, {
      cwd: join(__dirname, '..'),
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let started = false;
    let output = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(`[Port ${port}] ${text.trim()}`);

      // Check if server has started
      if (!started && (text.includes('ready in') || text.includes('Local:') || text.includes('running at'))) {
        started = true;
        console.log(`✅ Instance on port ${port} is ready!`);
        resolve(child);
      }
    });

    child.stderr.on('data', (data) => {
      const text = data.toString();
      console.error(`[Port ${port} ERROR] ${text.trim()}`);
    });

    child.on('error', (error) => {
      console.error(`[Port ${port}] Spawn error:`, error);
      reject(error);
    });

    child.on('close', (code) => {
      if (!started) {
        reject(new Error(`Instance on port ${port} failed to start (exit code: ${code})`));
      }
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!started) {
        child.kill();
        reject(new Error(`Instance on port ${port} timed out`));
      }
    }, 30000);
  });
}

async function startAllInstances() {
  const promises = [];

  for (let i = 0; i < INSTANCE_COUNT; i++) {
    const port = BASE_PORT + i;
    promises.push(startInstance(port));
  }

  try {
    const results = await Promise.all(promises);
    console.log(`\n🎉 All ${INSTANCE_COUNT} instances are running!`);
    console.log('\nPorts:');
    results.forEach((_, i) => {
      console.log(`  http://localhost:${BASE_PORT + i}`);
    });
    console.log('\nPress Ctrl+C to stop all instances');

    // Keep the script running
    process.on('SIGINT', () => {
      console.log('\nStopping all instances...');
      results.forEach((child) => {
        child.kill();
      });
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start instances:', error.message);
    process.exit(1);
  }
}

startAllInstances();