-- Room Reactions table for live emoji bursts
create table if not exists room_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  membership_id uuid not null references room_memberships(id) on delete cascade,
  emoji text not null,
  context_type text not null default 'general',
  context_id text,
  created_at timestamptz not null default now()
);

create index idx_room_reactions_room on room_reactions(room_id);
create index idx_room_reactions_created on room_reactions(created_at);

-- Enable realtime for room_reactions
alter publication supabase_realtime add table room_reactions;

-- RLS policies
alter table room_reactions enable row level security;

-- Anyone in the room can read reactions
create policy "Room members can read reactions"
  on room_reactions for select
  using (
    exists (
      select 1 from room_memberships
      where room_memberships.room_id = room_reactions.room_id
        and room_memberships.user_id = auth.uid()
    )
  );

-- Members can insert their own reactions
create policy "Members can insert own reactions"
  on room_reactions for insert
  with check (
    exists (
      select 1 from room_memberships
      where room_memberships.id = room_reactions.membership_id
        and room_memberships.user_id = auth.uid()
    )
  );
