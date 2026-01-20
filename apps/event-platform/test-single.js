// Simple test script to debug the issue
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const env = {
  ...process.env,
  BASE_URL: 'http://localhost:5173',
};

console.log('Testing single Playwright execution...');
console.log(`BASE_URL: ${env.BASE_URL}`);

const pnpmPath = process.platform === 'win32' ? 'C:\\nvm4w\\nodejs\\pnpm.cmd' : 'pnpm';
const testCommand = `${pnpmPath} exec playwright test tests/e2e/entry.spec.ts --workers=1 --reporter=line`;

console.log(`Running: ${testCommand}`);

exec(testCommand, {
  cwd: __dirname,
  env,
  stdio: 'inherit',
  shell: true
}, (error, stdout, stderr) => {
  if (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
  console.log('Test completed successfully');
});