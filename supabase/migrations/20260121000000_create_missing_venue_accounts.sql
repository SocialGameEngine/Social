-- Create missing venue_accounts table
-- This table was accidentally dropped or never created

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

-- Create venue_staff table for venue assignments
CREATE TABLE IF NOT EXISTS public.venue_staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venue_account_id UUID NOT NULL REFERENCES venue_accounts(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    permissions JSONB DEFAULT '{}',
    hired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(venue_account_id, venue_id)
);

-- Enable RLS
ALTER TABLE venue_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies for venue_accounts
-- Users can view their own venue account
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'venue_accounts' 
        AND policyname = 'Users can view own venue account'
    ) THEN
        CREATE POLICY "Users can view own venue account" ON venue_accounts
            FOR SELECT USING (auth.uid()::text = auth_user_id);
    END IF;
END $$;

-- Users can insert their own venue account
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'venue_accounts' 
        AND policyname = 'Users can insert own venue account'
    ) THEN
        CREATE POLICY "Users can insert own venue account" ON venue_accounts
            FOR INSERT WITH CHECK (auth.uid()::text = auth_user_id);
    END IF;
END $$;

-- Users can update their own venue account
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'venue_accounts' 
        AND policyname = 'Users can update own venue account'
    ) THEN
        CREATE POLICY "Users can update own venue account" ON venue_accounts
            FOR UPDATE USING (auth.uid()::text = auth_user_id);
    END IF;
END $$;

-- RLS Policies for venue_staff
-- Venue accounts can view their own staff assignments
CREATE POLICY "Venue accounts can view own staff assignments" ON venue_staff
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM venue_accounts 
            WHERE id = venue_account_id 
            AND auth.uid()::text = venue_accounts.auth_user_id
        )
    );

-- Service role can do everything (for edge functions)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'venue_accounts' 
        AND policyname = 'Service role full access to venue_accounts'
    ) THEN
        CREATE POLICY "Service role full access to venue_accounts" ON venue_accounts
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'venue_staff' 
        AND policyname = 'Service role full access to venue_staff'
    ) THEN
        CREATE POLICY "Service role full access to venue_staff" ON venue_staff
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_venue_accounts_auth_user_id ON venue_accounts(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_accounts_email ON venue_accounts(email);
CREATE INDEX IF NOT EXISTS idx_venue_accounts_active ON venue_accounts(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_venue_staff_venue_account_id ON venue_staff(venue_account_id);
CREATE INDEX IF NOT EXISTS idx_venue_staff_venue_id ON venue_staff(venue_id);

-- Insert test venue account for runescapepro5@gmail.com
-- This will be created when the user signs in through the venue-accounts-register function
-- No need to insert here since it should be created dynamically
