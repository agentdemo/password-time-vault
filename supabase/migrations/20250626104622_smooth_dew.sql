/*
  # Update password vault delay constraint

  1. Changes
    - Update the delay_seconds constraint to allow 1 second to 50 years (1576800000 seconds)
    - Previous constraint was 10 seconds to 1 year (31536000 seconds)

  2. Security
    - No changes to existing RLS policies
    - No changes to existing functions or triggers
*/

-- Drop the existing constraint
ALTER TABLE public.password_vaults 
DROP CONSTRAINT IF EXISTS password_vaults_delay_seconds_check;

-- Add the new constraint (1 second to 50 years)
ALTER TABLE public.password_vaults 
ADD CONSTRAINT password_vaults_delay_seconds_check 
CHECK (delay_seconds >= 1 AND delay_seconds <= 1576800000);