# Multi-Instance & Multi-User Event Platform Testing

This guide explains two different approaches for testing the event-platform application:

## 🚀 **Two Testing Modes**

### 1. **Single Server, Multiple Users** (Recommended for most cases)
- **One server** running on port 5173
- **Multiple concurrent users** accessing the same server
- **Shared session data** via backend (Supabase, etc.)
- **Isolated frontend sessions** per browser tab/user

### 2. **Multiple Servers, Isolated Sessions** (Legacy)
- **Multiple servers** on different ports (5173, 5174, 5175, etc.)
- **Completely isolated** sessions between instances
- **Separate memory spaces** per server

## Quick Start

### 🎯 **Single Server, Manual Multi-User Control** (Recommended)

```bash
# Start server for manual multi-user testing
pnpm run multi-user

# Or run directly:
node scripts/run-multi-user-manual.js
```

**What this does:**
- Starts one server on `http://localhost:5173`
- Automatically opens 3 browser tabs after 5 seconds
- Each browser tab represents a different user/device
- Manual control over each user's actions

### 🏗️ **Multiple Servers, Isolated Sessions** (Legacy)

```bash
# Run tests across 3 isolated server instances
pnpm run test:e2e:multi

# Run tests across 10 isolated server instances
pnpm run test:e2e:multi:10

# Start multiple isolated servers (no tests)
pnpm run dev:multi
```

## When to Use Each Approach

### 🎯 **Single Server, Multiple Users**
**Use this for:**
- Testing real user interactions and concurrency
- Load testing with realistic user patterns
- Multi-user features (chat, collaboration, etc.)
- Performance testing under concurrent load
- Simulating real-world usage scenarios

**Characteristics:**
- All users share the same server resources
- Backend sessions are shared (Supabase, databases)
- Frontend sessions isolated per browser/user
- More realistic for production-like testing

### 🏗️ **Multiple Servers, Isolated Sessions**
**Use this for:**
- Testing completely independent environments
- A/B testing different versions
- Development with multiple feature branches
- Testing server isolation and resource limits
- Legacy testing scenarios

**Characteristics:**
- Each server has completely separate memory/process
- No shared state between instances
- Higher resource usage (multiple Node processes)
- Good for testing infrastructure isolation

## How It Works

### Single Server, Multiple Users
- **One server** on port 5173
- **Multiple concurrent Playwright workers** (users)
- **Shared backend**, isolated frontend sessions
- **Realistic multi-user testing**

### Multiple Servers, Isolated Sessions
- **Base Port**: 5173 (configurable via `BASE_PORT`)
- **Instances**: Each instance runs on consecutive ports (5173, 5174, 5175, etc.)
- **Completely isolated** processes and sessions
- **Higher resource usage**

## Environment Variables

- `BASE_PORT`: Starting port number (default: 5173)
- `INSTANCE_COUNT`: Number of instances to run (default: 1 for backward compatibility)
- `VITE_USE_E2E_MOCKS`: Enable mock data for testing (default: false)

## Scripts

### `scripts/run-multi-instances.js`
Starts multiple Vite dev servers on consecutive ports.

Usage:
```bash
node scripts/run-multi-instances.js [instance_count]
```

### `scripts/run-multi-instance-tests.js`
Starts multiple instances and runs Playwright tests across them.

Usage:
```bash
node scripts/run-multi-instance-tests.js [instance_count] [test_command]
```

## Examples

### Basic 3-instance test run
```bash
pnpm run test:e2e:multi
```

### Run specific test file across 5 instances
```bash
node scripts/run-multi-instance-tests.js 5 "playwright test auth.spec.ts"
```

### Run tests in headed mode across 2 instances
```bash
node scripts/run-multi-instance-tests.js 2 "playwright test --headed"
```

### Start 10 instances for manual testing
```bash
node scripts/run-multi-instances.js 10
```

## Performance Considerations

- **Memory**: Each instance consumes ~100-200MB of RAM
- **CPU**: Parallel test execution utilizes multiple cores
- **Network**: Multiple ports may require firewall adjustments
- **Disk**: Test artifacts (screenshots, traces) multiply by instance count

## Troubleshooting

### Port conflicts
If ports are already in use, the script will fail. Check and free ports:
```bash
# Windows
netstat -ano | findstr :5173

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Instance startup timeout
Increase timeout in `run-multi-instances.js` if instances take longer to start.

### Test failures
Check Playwright traces and screenshots in the test results directory for each instance.

## Advanced Usage

### Custom base port
```bash
BASE_PORT=3000 node scripts/run-multi-instance-tests.js 5
```

### Run only specific browsers
Modify the `generateProjects()` function in `playwright.config.ts` to filter browsers.

### Custom test distribution
Create custom test files that target specific instances using the `instance` metadata.