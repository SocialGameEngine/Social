-- Base Schema Migration
-- Creates core tables needed by subsequent migrations
-- This migration must run before 20260326200000_restore_dropped_tables.sql

-- =============================================================================
-- ROOMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(6) NOT NULL UNIQUE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  settings jsonb DEFAULT '{}'::jsonb,
  current_sociale_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_creator_id ON public.rooms(creator_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- =============================================================================
-- ROOM MEMBERSHIPS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.room_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('host', 'moderator', 'member', 'guest')),
  is_host boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'approved', 'pending', 'rejected')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_room_memberships_room_id ON public.room_memberships(room_id);
CREATE INDEX IF NOT EXISTS idx_room_memberships_user_id ON public.room_memberships(user_id);

-- =============================================================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_memberships ENABLE ROW LEVEL SECURITY;

-- Rooms policies
CREATE POLICY "Anyone can view active rooms" ON public.rooms
  FOR SELECT USING (status = 'active');

CREATE POLICY "Hosts can manage their rooms" ON public.rooms
  FOR ALL USING (creator_id = auth.uid());

-- Room memberships policies
CREATE POLICY "Users can view memberships in their rooms" ON public.room_memberships
  FOR SELECT USING (
    room_id IN (
      SELECT room_id FROM public.room_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own memberships" ON public.room_memberships
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own memberships" ON public.room_memberships
  FOR UPDATE USING (user_id = auth.uid());

-- =============================================================================
-- COMPLETION LOG
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE 'BASE SCHEMA MIGRATION COMPLETED';
    RAISE NOTICE 'Created tables: rooms, room_memberships';
    RAISE NOTICE 'All indexes and RLS policies created';
END $$;
