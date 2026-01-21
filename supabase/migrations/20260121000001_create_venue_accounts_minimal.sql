-- Create venue_accounts table (minimal, safe approach)
CREATE TABLE IF NOT EXISTS public.venue_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('bar_owner', 'staff')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE venue_accounts ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view own venue account" ON venue_accounts
    FOR SELECT USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can insert own venue account" ON venue_accounts
    FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);

CREATE POLICY "Users can update own venue account" ON venue_accounts
    FOR UPDATE USING (auth.uid()::text = auth_user_id);

CREATE POLICY "Service role full access" ON venue_accounts
    FOR ALL USING (role() = 'service_role');

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_venue_accounts_auth_user_id ON venue_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_accounts_active ON venue_accounts(is_active) WHERE is_active = true;
