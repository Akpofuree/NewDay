UPDATE groups
SET name = 'Personal Workspace',
    description = 'Your default NewDay workspace.',
    payload = payload
      || '{"name":"Personal Workspace","description":"Your default NewDay workspace."}'::jsonb
WHERE id = 'group_personal'
  AND (name = 'Engineering' OR payload->>'name' = 'Engineering');
