BEGIN;

INSERT INTO public.templates (user_id, name, description, is_preset, config)
VALUES
  (NULL, 'Pomodoro Classic', 'Classic Pomodoro timing using the 25-minute focus and 5-minute break fields.', true,
    '{"subject":"Pomodoro Classic","focusMin":25,"breakMin":5}'::jsonb),
  (NULL, 'Deep Work', 'A long, uninterrupted block for demanding work.', true,
    '{"subject":"Deep Work","focusMin":90,"breakMin":15}'::jsonb),
  (NULL, 'Quick Sprint', 'A short burst for a small task or a quick start.', true,
    '{"subject":"Quick Sprint","focusMin":15,"breakMin":3}'::jsonb),
  (NULL, 'Study Session', 'A steady study block with a short recovery break.', true,
    '{"subject":"Study","focusMin":50,"breakMin":10}'::jsonb),
  (NULL, 'Reading Time', 'A calm block for focused reading.', true,
    '{"subject":"Reading","focusMin":30,"breakMin":5}'::jsonb),
  (NULL, 'Creative Writing', 'A dedicated block to draft, revise, or explore ideas.', true,
    '{"subject":"Creative Writing","focusMin":45,"breakMin":10}'::jsonb),
  (NULL, 'Coding Block', 'A substantial block for coding without distractions.', true,
    '{"subject":"Coding","focusMin":60,"breakMin":10}'::jsonb),
  (NULL, 'Admin & Emails', 'A short block to clear messages and administrative tasks.', true,
    '{"subject":"Admin & Emails","focusMin":20,"breakMin":5}'::jsonb),
  (NULL, 'Workout', 'A focused 30-minute workout with no break.', true,
    '{"subject":"Workout","focusMin":30,"breakMin":0}'::jsonb),
  (NULL, 'Reflection & Planning', 'A brief pause to reflect and plan your next steps.', true,
    '{"subject":"Reflection & Planning","focusMin":10,"breakMin":0}'::jsonb)
ON CONFLICT (lower(name)) WHERE is_preset
DO UPDATE SET description = EXCLUDED.description, config = EXCLUDED.config, updated_at = now();

COMMIT;
