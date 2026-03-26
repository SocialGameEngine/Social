-- Check what the current constraint actually allows
SELECT 
  conname,
  convalidated,
  conkey,
  confkey,
  confupdtype,
  condeltype,
  conislocal
FROM pg_constraint 
WHERE conrelid = 'public.interactions'::regclass 
AND conname = 'interactions_type_check';

-- Also check what interaction types currently exist in the table
SELECT DISTINCT type FROM public.interactions ORDER BY type;
