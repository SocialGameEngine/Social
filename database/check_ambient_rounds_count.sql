-- Check ambient rounds count by pack
SELECT 
  ap.id as pack_id,
  ap.name as pack_name,
  COUNT(ar.id) as round_count
FROM ambient_packs ap
LEFT JOIN ambient_rounds ar ON ar.pack_id = ap.id
GROUP BY ap.id, ap.name
ORDER BY ap.name;

-- Check for duplicate order_index values within packs (should be 0)
SELECT 
  pack_id,
  order_index,
  COUNT(*) as duplicate_count
FROM ambient_rounds
GROUP BY pack_id, order_index
HAVING COUNT(*) > 1;

-- Check which pack the current Sociale is using
SELECT 
  s.id as sociale_id,
  s.title,
  s.mode,
  s.total_rounds,
  s.ambient_pack_id,
  ap.name as pack_name
FROM sociales s
LEFT JOIN ambient_packs ap ON ap.id = s.ambient_pack_id
WHERE s.mode = 'ambient'
ORDER BY s.created_at DESC
LIMIT 5;
