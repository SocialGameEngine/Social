# Local Development Workflow

## 🛠️ Pre-commit Checks Setup

To ensure your local development catches the same errors as Vercel, we've set up automatic TypeScript checking.

### 📋 Available Commands

```bash
# Full build (same as Vercel)
pnpm run build

# TypeScript only (faster)
pnpm run type-check

# Pre-commit check (runs type-check across all packages)
pnpm run pre-commit

# Development server
pnpm run dev
```

### 🔄 Recommended Workflow

1. **Before committing changes:**
   ```bash
   pnpm run pre-commit
   ```

2. **Before pushing to remote:**
   ```bash
   pnpm run build
   ```

3. **During development:**
   ```bash
   pnpm run dev  # For hot reload
   # Periodically run:
   pnpm run type-check
   ```

### 🎯 What These Commands Catch

- **Unused imports/variables** (like the ones we just fixed)
- **Type errors** (like the ViboxVotingContext RPC issues)
- **Missing properties** (interface mismatches)
- **All the same errors Vercel would catch**

### 💡 IDE Setup

Make sure your IDE (VS Code/Cursor) shows TypeScript errors:
- ✅ TypeScript errors enabled
- ✅ Using workspace TypeScript settings
- ✅ No "ignore" rules for unused variables

### 🚀 Result

Now `pnpm run pre-commit` will catch all the same issues that would fail the Vercel build, so you can fix them locally before pushing!
