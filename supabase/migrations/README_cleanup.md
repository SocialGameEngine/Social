# Migration Cleanup Guide

## Files that can be removed (consolidated into 20260206110000_consolidate_interactions_schema.sql):

### Core Interactions Schema (Consolidated):
- ❌ `20260206010000_add_voting_to_interactions.sql` → ✅ Consolidated
- ❌ `20260206020000_add_results_status_to_interactions.sql` → ✅ Consolidated  
- ❌ `20260206030000_fix_interaction_votes_rls.sql` → ✅ Consolidated
- ❌ `20260206040000_fix_interaction_votes_rls_again.sql` → ✅ Consolidated
- ❌ `20260206050000_fix_responses_rls.sql` → ✅ Consolidated
- ❌ `20260206060000_update_voting_duration_to_5_minutes.sql` → ✅ Consolidated
- ❌ `20260206070000_add_answer_timer_to_interactions.sql` → ✅ Consolidated
- ❌ `20260206080000_fix_results_constraint.sql` → ✅ Consolidated
- ❌ `20260206090000_fix_answer_timer_trigger.sql` → ✅ Consolidated
- ❌ `20260206100000_cleanup_unused_functions.sql` → ✅ Consolidated

### Files to KEEP:
- ✅ `20250101000000_initial_schema.sql` - Base schema
- ✅ `20250101000001_add_helper_functions.sql` - Helper functions
- ✅ `20260206000000_create_interactions_tables.sql` - Base interactions tables
- ✅ `20260206110000_consolidate_interactions_schema.sql` - NEW consolidated schema

### Files to remove manually:
- `20260110.sql` (empty)
- `20260111.sql` (empty)
- `20260106000000_add_session_pause_columns.sql.disabled` (disabled)

## Cleanup Commands:

```bash
# Remove consolidated migration files
rm 20260206010000_add_voting_to_interactions.sql
rm 20260206020000_add_results_status_to_interactions.sql  
rm 20260206030000_fix_interaction_votes_rls.sql
rm 20260206040000_fix_interaction_votes_rls_again.sql
rm 20260206050000_fix_responses_rls.sql
rm 20260206060000_update_voting_duration_to_5_minutes.sql
rm 20260206070000_add_answer_timer_to_interactions.sql
rm 20260206080000_fix_results_constraint.sql
rm 20260206090000_fix_answer_timer_trigger.sql
rm 20260206100000_cleanup_unused_functions.sql

# Remove empty/disabled files
rm 20260110.sql
rm 20260111.sql  
rm 20260106000000_add_session_pause_columns.sql.disabled
```

## Result:
- **Before**: 11 interaction-related migration files
- **After**: 2 interaction-related migration files (base + consolidated)
- **Space saved**: ~15KB of migration files
- **Complexity reduced**: Single comprehensive migration instead of 10 small ones
