-- =============================================================================
-- RESTORE ROOM_MESSAGES TABLE
-- =============================================================================
-- This table was incorrectly marked as unused and dropped in cleanup migration
-- but the chat system is still actively using it. Recreate the table.

-- Recreate room_messages table (based on remote schema)
CREATE TABLE IF NOT EXISTS public.room_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    room_id uuid NOT NULL,
    user_id uuid NOT NULL,
    membership_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now(),
    is_hidden boolean DEFAULT false NOT NULL,
    hidden_by uuid,
    content_type text DEFAULT 'text' NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Add foreign key constraints
ALTER TABLE public.room_messages 
ADD CONSTRAINT room_messages_room_id_fkey 
FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE;

ALTER TABLE public.room_messages 
ADD CONSTRAINT room_messages_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.room_messages 
ADD CONSTRAINT room_messages_membership_id_fkey 
FOREIGN KEY (membership_id) REFERENCES public.room_memberships(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON public.room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON public.room_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_room_messages_membership_id ON public.room_messages(membership_id);

-- Enable RLS
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (based on remote schema patterns)
CREATE POLICY "Users can view messages in their rooms" ON public.room_messages
    FOR SELECT USING (
        room_id IN (
            SELECT room_id FROM public.room_memberships 
            WHERE user_id = auth.uid() 
            AND is_banned = false 
            AND status IN ('active', 'approved')
        )
    );

CREATE POLICY "Users can insert messages in their rooms" ON public.room_messages
    FOR INSERT WITH CHECK (
        room_id IN (
            SELECT room_id FROM public.room_memberships 
            WHERE user_id = auth.uid() 
            AND is_banned = false 
            AND status IN ('active', 'approved')
        )
        AND user_id = auth.uid()
        AND membership_id IN (
            SELECT id FROM public.room_memberships 
            WHERE user_id = auth.uid() 
            AND room_id = room_id
        )
    );

CREATE POLICY "Users can update their own messages" ON public.room_messages
    FOR UPDATE USING (
        user_id = auth.uid() OR
        room_id IN (
            SELECT room_id FROM public.room_memberships 
            WHERE user_id = auth.uid() 
            AND is_banned = false 
            AND status IN ('active', 'approved')
            AND is_host = true
        )
    );

CREATE POLICY "Users can delete their own messages" ON public.room_messages
    FOR DELETE USING (
        user_id = auth.uid() OR
        room_id IN (
            SELECT room_id FROM public.room_memberships 
            WHERE user_id = auth.uid() 
            AND is_banned = false 
            AND status IN ('active', 'approved')
            AND is_host = true
        )
    );

-- Verify table creation
DO $$
BEGIN
    RAISE NOTICE 'room_messages table restored successfully';
END $$;
