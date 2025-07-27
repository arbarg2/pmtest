
-- Check if case_id should be nullable or if we need to adjust the trigger
-- Looking at the current schema, case_id is marked as NOT NULL but should be auto-generated
-- Let's make sure the case_id column can be handled by the trigger properly

-- First, let's check the current trigger setup
-- The trigger should handle NULL case_id values by generating them

-- Update the trigger to ensure it works correctly with NULL case_id
DROP TRIGGER IF EXISTS set_case_id_trigger ON cases;

CREATE OR REPLACE FUNCTION public.set_case_id_v2()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only set case_id if it's null or empty
  IF NEW.case_id IS NULL OR NEW.case_id = '' THEN
    NEW.case_id := generate_case_id_v2();
  END IF;
  
  -- Always update the updated_at timestamp
  NEW.updated_at := now();
  
  RETURN NEW;
END;
$function$;

-- Create the trigger that fires before INSERT and UPDATE
CREATE TRIGGER set_case_id_trigger
    BEFORE INSERT OR UPDATE ON cases
    FOR EACH ROW
    EXECUTE FUNCTION set_case_id_v2();

-- Also, let's make case_id have a default value as backup
ALTER TABLE cases ALTER COLUMN case_id SET DEFAULT '';
