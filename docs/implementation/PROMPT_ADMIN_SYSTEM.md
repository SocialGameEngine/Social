# Prompt Library Admin System

## Overview

This document outlines the complete implementation of a database-first prompt library administration system. The system moves away from file-based prompt storage to a centralized database approach with full admin interface capabilities.

## Current State vs. Future State

### Current Architecture (File-Based)
- **Source of Truth**: JSON files in `src/shared/`
- **Database**: Synced from files via migration scripts
- **Updates**: Manual file editing + migration generation
- **Limitations**: Requires code changes, deployment for updates

### Target Architecture (Database-First)
- **Source of Truth**: Supabase database tables
- **Files**: Removed/replaced with API calls
- **Updates**: Real-time via admin interface or direct SQL
- **Benefits**: Instant updates, admin controls, analytics

## Database Schema

### Core Tables

#### `prompt_libraries`
```sql
CREATE TABLE prompt_libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### `prompts`
```sql
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID REFERENCES prompt_libraries(id),
  text TEXT NOT NULL,
  category TEXT,
  difficulty_level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### `prompt_usage`
```sql
CREATE TABLE prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID REFERENCES prompts(id),
  session_id UUID,
  venue_id UUID,
  used_at TIMESTAMP DEFAULT now(),
  usage_count INTEGER DEFAULT 1
);
```

## Implementation Components

### 1. Database Migration
**File**: `supabase/migrations/20260120000000_create_prompt_admin_tables.sql`

Creates all necessary tables, indexes, and RLS policies for the prompt admin system.

### 2. Edge Functions

#### `admin-prompts` - CRUD Operations
```typescript
// GET /admin-prompts - List all prompts
// POST /admin-prompts - Create new prompt
// PUT /admin-prompts/:id - Update prompt
// DELETE /admin-prompts/:id - Delete prompt
```

#### `admin-libraries` - Library Management
```typescript
// GET /admin-libraries - List all libraries
// POST /admin-libraries - Create new library
// PUT /admin-libraries/:id - Update library
// DELETE /admin-libraries/:id - Delete library
```

#### `admin-analytics` - Usage Analytics
```typescript
// GET /admin-analytics/usage - Get prompt usage statistics
// GET /admin-analytics/popular - Most used prompts
// GET /admin-analytics/performance - Prompt performance metrics
```

### 3. Frontend Components

#### Admin Dashboard (`apps/web/src/pages/admin/PromptsAdmin.tsx`)
- Library management interface
- Prompt CRUD operations
- Bulk import/export functionality
- Usage analytics dashboard

#### Prompt Editor (`apps/web/src/components/admin/PromptEditor.tsx`)
- Rich text editing for prompt text
- Category and difficulty assignment
- Preview functionality
- Validation and error handling

#### Library Manager (`apps/web/src/components/admin/LibraryManager.tsx`)
- Create/edit/delete libraries
- Drag-and-drop prompt organization
- Library activation/deactivation
- Export/import libraries

## Simple Prompt Library Admin

### Overview
A local-only admin interface for managing prompt libraries directly in the database. No roles, no deployment, no extra security - just a simple tool to make prompt management easier.

### Simplified Architecture

#### What It Is
- **Local Development Tool**: Run locally with `pnpm dev`
- **Database-First**: All data stored in Supabase database
- **Direct DB Access**: No authentication/roles needed
- **Simple UI**: Basic forms and lists for management

#### What It Isn't
- ❌ No user roles or permissions
- ❌ No authentication system
- ❌ No hosting on Vercel
- ❌ No complex security/RLS
- ❌ No analytics or advanced features

### Implementation

#### File Structure
```
apps/prompt-admin/
├── src/
│   ├── pages/
│   │   ├── PromptsPage.tsx      # Main prompt management
│   │   ├── LibrariesPage.tsx    # Library management
│   │   └── AnalyticsPage.tsx    # Basic usage stats
│   ├── components/
│   │   ├── PromptForm.tsx       # Add/edit prompts
│   │   ├── PromptList.tsx       # List all prompts
│   │   ├── LibraryForm.tsx      # Add/edit libraries
│   │   └── SearchFilter.tsx     # Search and filter
│   └── lib/
│       ├── supabase.ts          # Direct DB client
│       └── types.ts             # TypeScript types
├── package.json
└── vite.config.ts
```

#### Key Features
- **Direct Database Access**: Uses Supabase service role key
- **Real-time Updates**: Changes reflected immediately
- **Bulk Operations**: Import/export prompts in bulk
- **Search & Filter**: Find prompts quickly
- **Preview Mode**: See how prompts will appear in game

### Usage

#### Development Setup
```bash
cd apps/prompt-admin
pnpm install
pnpm dev
```

#### Database Connection
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

## Migration Strategy

### Phase 1: Database Setup
1. Create new tables with proper schema
2. Migrate existing prompts from JSON files
3. Set up RLS policies for security

### Phase 2: Admin Interface
1. Build simple admin interface
2. Implement CRUD operations
3. Add bulk import/export functionality

### Phase 3: Integration
1. Update game engine to use database prompts
2. Remove JSON file dependencies
3. Deploy admin interface

### Phase 4: Advanced Features
1. Add analytics and usage tracking
2. Implement prompt versioning
3. Add collaborative editing features

## Benefits

### For Developers
- **Instant Updates**: No more migration files for prompt changes
- **Version Control**: Database tracks all changes automatically
- **Analytics**: Real-time usage data and insights
- **Collaboration**: Multiple users can manage prompts simultaneously

### For Venue Staff
- **Easy Management**: Simple web interface for prompt management
- **Custom Libraries**: Create venue-specific prompt collections
- **Performance Tracking**: See which prompts work best
- **Quick Updates**: Change prompts on the fly for events

### For the Business
- **Rapid Iteration**: Test new prompts without deployment
- **Data-Driven Decisions**: Use analytics to optimize content
- **Scalability**: Easy to add new prompts and categories
- **Quality Control**: Better oversight of prompt content

---

*Last updated: January 2026*
