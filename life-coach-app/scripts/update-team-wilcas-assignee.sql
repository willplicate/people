-- Update Team Wilcas assignee constraint to use "Jucas" instead of "Partner"

-- Drop the old constraint
ALTER TABLE team_wilcas_tasks DROP CONSTRAINT IF EXISTS team_wilcas_tasks_assigned_to_check;

-- Add new constraint with "Jucas"
ALTER TABLE team_wilcas_tasks
  ADD CONSTRAINT team_wilcas_tasks_assigned_to_check
  CHECK (assigned_to IN ('Will', 'Jucas', 'Either'));

-- Update any existing "Partner" entries to "Jucas"
UPDATE team_wilcas_tasks SET assigned_to = 'Jucas' WHERE assigned_to = 'Partner';
