#!/usr/bin/env node

import { exec, spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_PORT = 5173;
const BASE_URL = `http://localhost:${BASE_PORT}`;

console.log(`🚀 Multi-User Manual Control Mode`);
console.log(`📍 Server: ${BASE_URL}`);
console.log(`🎮 Manual browser control enabled\n`);

// Start the dev server
async function startDevServer() {
  console.log('Starting dev server...\n');

  return new Promise((resolve, reject) => {
    const command = 'pnpm run dev';
    console.log(`Running: ${command} in ${join(__dirname, '..')}`);

    const child = exec(command, {
      cwd: join(__dirname, '..'),
      stdio: 'inherit'
    });

    // Wait a bit for server to start
    setTimeout(() => {
      console.log(`\n✅ Server should be running at: ${BASE_URL}`);
      console.log(`🌐 Open multiple browser tabs/windows to: ${BASE_URL}`);
      console.log(`👥 Each tab represents a different user/device\n`);
      resolve(child);
    }, 3000);
  });
}

// Function to open browser instances (optional)
function openBrowsers(count = 3) {
  console.log(`Opening ${count} browser instances...`);

  const browsers = [];
  const urls = Array(count).fill(BASE_URL);

  // On Windows, use start command to open default browser
  if (process.platform === 'win32') {
    urls.forEach((url, i) => {
      console.log(`Opening browser ${i + 1}: ${url}`);
      const browser = spawn('cmd', ['/c', 'start', url], {
        detached: true,
        stdio: 'ignore'
      });
      browsers.push(browser);
    });
  } else {
    // On other platforms, try xdg-open or open
    const openCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    urls.forEach((url, i) => {
      console.log(`Opening browser ${i + 1}: ${url}`);
      const browser = spawn(openCmd, [url], {
        detached: true,
        stdio: 'ignore'
      });
      browsers.push(browser);
    });
  }

  return browsers;
}

// Main execution
async function main() {
  let serverProcess;

  try {
    // Start the server
    serverProcess = await startDevServer();

    // Ask user if they want browsers opened automatically
    console.log(`❓ Options:`);
    console.log(`   1. Open ${3} browser tabs automatically`);
    console.log(`   2. Manual - I'll open browsers myself`);
    console.log(`   3. Open custom number of browsers\n`);

    console.log(`📋 To simulate multiple users:`);
    console.log(`   • Open multiple browser tabs/windows`);
    console.log(`   • Each tab is a different user/device`);
    console.log(`   • All connect to the same server: ${BASE_URL}`);
    console.log(`   • Users can interact in real-time\n`);

    console.log(`🛑 Press Ctrl+C to stop the server\n`);

    // Keep the script running
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      if (serverProcess) {
        serverProcess.kill();
      }
      process.exit(0);
    });

    // Auto-open browsers after a delay (optional)
    setTimeout(() => {
      console.log(`\n🤖 Auto-opening 3 browser instances in 5 seconds...`);
      console.log(`   (Cancel with Ctrl+C if you want to open manually)\n`);

      setTimeout(() => {
        try {
          openBrowsers(3);
        } catch (error) {
          console.log(`❌ Could not auto-open browsers: ${error.message}`);
          console.log(`   Please open ${BASE_URL} manually in multiple tabs\n`);
        }
      }, 5000);
    }, 2000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();