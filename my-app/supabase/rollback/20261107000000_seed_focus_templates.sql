BEGIN;

DELETE FROM public.templates
WHERE is_preset
  AND name IN (
    'Pomodoro Classic',
    'Deep Work',
    'Quick Sprint',
    'Study Session',
    'Reading Time',
    'Creative Writing',
    'Coding Block',
    'Admin & Emails',
    'Workout',
    'Reflection & Planning'
  );

COMMIT;
