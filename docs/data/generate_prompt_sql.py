import json
import os

# Read the prompt data
with open('a:/Social/prompt_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Start building the SQL
sql = """-- ============================================================================
-- COMPLETE PROMPT LIBRARY SEED DATA
-- ============================================================================
-- This script populates all 24 prompt libraries with their prompts
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Insert all prompt libraries
INSERT INTO prompt_libraries (id, name, emoji, description, is_active, sort_order) VALUES
"""

# Add libraries
for i, lib in enumerate(data):
    name = lib['name'].replace("'", "''")
    desc = lib['description'].replace("'", "''")
    sql += f"  ('{lib['id']}', '{name}', '{lib['emoji']}', '{desc}', true, {i})"
    sql += ",\n" if i < len(data) - 1 else ";\n"

sql += """
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, 
  emoji = EXCLUDED.emoji, 
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Step 2: Insert all prompts
"""

# Add prompts for each library
for lib in data:
    sql += f"\n-- {lib['name']} prompts\n"
    for i, prompt in enumerate(lib['prompts']):
        # Escape single quotes and backslashes
        escaped = prompt.replace("\\", "\\\\").replace("'", "''")
        sql += f"INSERT INTO prompts (library_id, text, is_active, sort_order) VALUES ('{lib['id']}', '{escaped}', true, {i}) ON CONFLICT DO NOTHING;\n"

# ============================================================================
# TEAM SYSTEM SEED DATA
# ============================================================================

# Sample teams for testing (would normally be created dynamically)
sample_teams = [
    {
        'id': '550e8400-e29b-41d4-a716-446655440001',
        'session_id': '550e8400-e29b-41d4-a716-446655440000',  # Sample session ID
        'name': 'The Roasters',
        'team_code': '1234',
        'captain_id': '550e8400-e29b-41d4-a716-446655440010',  # Sample user ID
        'created_at': '2025-01-22T18:00:00Z'
    },
    {
        'id': '550e8400-e29b-41d4-a716-446655440002',
        'session_id': '550e8400-e29b-41d4-a716-446655440000',
        'name': 'Bar Flies',
        'team_code': '5678',
        'captain_id': '550e8400-e29b-41d4-a716-446655440011',
        'created_at': '2025-01-22T18:01:00Z'
    },
    {
        'id': '550e8400-e29b-41d4-a716-446655440003',
        'session_id': '550e8400-e29b-41d4-a716-446655440000',
        'name': 'The Regulars',
        'team_code': '9012',
        'captain_id': '550e8400-e29b-41d4-a716-446655440012',
        'created_at': '2025-01-22T18:02:00Z'
    }
]

# Sample team codes for the session
sample_team_codes = [
    {'code': '1111', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '2222', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '3333', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '4444', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '5555', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '6666', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '7777', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '8888', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '9999', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '0000', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'is_used': False},
    {'code': '1234', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'team_id': '550e8400-e29b-41d4-a716-446655440001', 'is_used': True, 'assigned_at': '2025-01-22T18:00:00Z'},
    {'code': '5678', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'team_id': '550e8400-e29b-41d4-a716-446655440002', 'is_used': True, 'assigned_at': '2025-01-22T18:01:00Z'},
    {'code': '9012', 'session_id': '550e8400-e29b-41d4-a716-446655440000', 'team_id': '550e8400-e29b-41d4-a716-446655440003', 'is_used': True, 'assigned_at': '2025-01-22T18:02:00Z'},
]

# Sample team members (linking users to teams)
sample_team_members = [
    # Team 1: The Roasters (Captain: user 010)
    {
        'id': '550e8400-e29b-41d4-a716-446655440100',
        'team_id': '550e8400-e29b-41d4-a716-446655440001',
        'user_id': '550e8400-e29b-41d4-a716-446655440010',
        'device_id': 'device-roasters-1',
        'is_captain': True,
        'joined_at': '2025-01-22T18:00:00Z',
        'last_active': '2025-01-22T18:30:00Z'
    },
    {
        'id': '550e8400-e29b-41d4-a716-446655440101',
        'team_id': '550e8400-e29b-41d4-a716-446655440001',
        'user_id': '550e8400-e29b-41d4-a716-446655440013',
        'device_id': 'device-roasters-2',
        'is_captain': False,
        'joined_at': '2025-01-22T18:05:00Z',
        'last_active': '2025-01-22T18:25:00Z'
    },
    # Team 2: Bar Flies (Captain: user 011)
    {
        'id': '550e8400-e29b-41d4-a716-446655440102',
        'team_id': '550e8400-e29b-41d4-a716-446655440002',
        'user_id': '550e8400-e29b-41d4-a716-446655440011',
        'device_id': 'device-flies-1',
        'is_captain': True,
        'joined_at': '2025-01-22T18:01:00Z',
        'last_active': '2025-01-22T18:35:00Z'
    },
    {
        'id': '550e8400-e29b-41d4-a716-446655440103',
        'team_id': '550e8400-e29b-41d4-a716-446655440002',
        'user_id': '550e8400-e29b-41d4-a716-446655440014',
        'device_id': 'device-flies-2',
        'is_captain': False,
        'joined_at': '2025-01-22T18:03:00Z',
        'last_active': '2025-01-22T18:28:00Z'
    },
    {
        'id': '550e8400-e29b-41d4-a716-446655440104',
        'team_id': '550e8400-e29b-41d4-a716-446655440002',
        'user_id': '550e8400-e29b-41d4-a716-446655440015',
        'device_id': 'device-flies-3',
        'is_captain': False,
        'joined_at': '2025-01-22T18:07:00Z',
        'last_active': '2025-01-22T18:32:00Z'
    },
    # Team 3: The Regulars (Captain: user 012)
    {
        'id': '550e8400-e29b-41d4-a716-446655440105',
        'team_id': '550e8400-e29b-41d4-a716-446655440003',
        'user_id': '550e8400-e29b-41d4-a716-446655440012',
        'device_id': 'device-regulars-1',
        'is_captain': True,
        'joined_at': '2025-01-22T18:02:00Z',
        'last_active': '2025-01-22T18:40:00Z'
    }
]

sql += """
-- ============================================================================
-- STEP 2: Insert Sample Teams with Team Codes and Captains
-- ============================================================================

-- Insert sample teams
INSERT INTO teams (id, session_id, name, team_code, captain_id, created_at) VALUES
"""

for i, team in enumerate(sample_teams):
    sql += f"""  ('{team['id']}', '{team['session_id']}', '{team['name']}', '{team['team_code']}', '{team['captain_id']}', '{team['created_at']}')"""
    sql += ",\n" if i < len(sample_teams) - 1 else ";\n"

sql += """
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  team_code = EXCLUDED.team_code,
  captain_id = EXCLUDED.captain_id;

-- Insert sample team codes for the session
INSERT INTO team_codes (code, session_id, team_id, is_used, assigned_at) VALUES
"""

for i, code in enumerate(sample_team_codes):
    team_id_part = f", '{code['team_id']}'" if 'team_id' in code else ", NULL"
    assigned_at_part = f", '{code['assigned_at']}'" if 'assigned_at' in code else ", NULL"
    sql += f"""  ('{code['code']}', '{code['session_id']}'{team_id_part}, {code['is_used']}{assigned_at_part})"""
    sql += ",\n" if i < len(sample_team_codes) - 1 else ";\n"

sql += """
ON CONFLICT (code) DO UPDATE SET
  team_id = EXCLUDED.team_id,
  is_used = EXCLUDED.is_used,
  assigned_at = EXCLUDED.assigned_at;

-- Insert sample team members
INSERT INTO team_members (id, team_id, user_id, device_id, is_captain, joined_at, last_active) VALUES
"""

for i, member in enumerate(sample_team_members):
    sql += f"""  ('{member['id']}', '{member['team_id']}', '{member['user_id']}', '{member['device_id']}', {member['is_captain']}, '{member['joined_at']}', '{member['last_active']}')"""
    sql += ",\n" if i < len(sample_team_members) - 1 else ";\n"

sql += """
ON CONFLICT (team_id, user_id, device_id) DO UPDATE SET
  is_captain = EXCLUDED.is_captain,
  last_active = EXCLUDED.last_active;

-- ============================================================================
-- STEP 3: Verify the seed (Updated to include team data)
-- ============================================================================

-- Verify prompts are seeded
SELECT
  '=== PROMPT LIBRARIES SEEDED ===' as status,
  COUNT(*) as total_libraries
FROM prompt_libraries;

SELECT
  '=== PROMPTS SEEDED ===' as status,
  COUNT(*) as total_prompts
FROM prompts;

SELECT
  pl.id,
  pl.name,
  pl.emoji,
  COUNT(p.id) as prompt_count
FROM prompt_libraries pl
LEFT JOIN prompts p ON p.library_id = pl.id
GROUP BY pl.id, pl.name, pl.emoji, pl.sort_order
ORDER BY pl.sort_order;

-- Verify teams are seeded
SELECT
  '=== TEAMS SEEDED ===' as status,
  COUNT(*) as total_teams
FROM teams;

SELECT
  '=== TEAM CODES SEEDED ===' as status,
  COUNT(*) as total_codes,
  COUNT(CASE WHEN is_used THEN 1 END) as used_codes,
  COUNT(CASE WHEN NOT is_used THEN 1 END) as available_codes
FROM team_codes;

SELECT
  '=== TEAM MEMBERS SEEDED ===' as status,
  COUNT(*) as total_members,
  COUNT(CASE WHEN is_captain THEN 1 END) as captains,
  COUNT(DISTINCT team_id) as teams_with_members
FROM team_members;

-- Show team details
SELECT
  t.id,
  t.name,
  t.team_code,
  COUNT(tm.id) as member_count,
  COUNT(CASE WHEN tm.is_captain THEN 1 END) as captain_count
FROM teams t
LEFT JOIN team_members tm ON tm.team_id = t.id
GROUP BY t.id, t.name, t.team_code
ORDER BY t.created_at;

SELECT '=== DATABASE READY FOR GAME SESSIONS WITH TEAM SUPPORT ===' as result;
"""

# Write to file
with open('a:/Social/COMPLETE_PROMPT_SEED.sql', 'w', encoding='utf-8') as f:
    f.write(sql)

print(f"[OK] Generated SQL with {len(data)} libraries")
total_prompts = sum(len(lib['prompts']) for lib in data)
print(f"[OK] Total prompts: {total_prompts}")

# Team system stats
total_teams = len(sample_teams)
total_team_codes = len(sample_team_codes)
total_team_members = len(sample_team_members)
total_captains = sum(1 for m in sample_team_members if m['is_captain'])

print(f"[OK] Sample teams: {total_teams}")
print(f"[OK] Team codes: {total_team_codes}")
print(f"[OK] Team members: {total_team_members} (including {total_captains} captains)")
print(f"[OK] Output file: a:/Social/COMPLETE_PROMPT_SEED.sql")
