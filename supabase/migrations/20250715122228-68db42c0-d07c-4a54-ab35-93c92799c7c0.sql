
-- Check and fix the record ID generation sequence
-- First, let's see what the current sequence value is and reset it properly
SELECT setval('record_id_seq', COALESCE((SELECT MAX(SUBSTRING(record_id FROM 'LR_\d+_(\d+)')::INTEGER) FROM investigation_records WHERE record_id ~ 'LR_\d+_\d+'), 0) + 1);

-- Update the generate_record_id function to be more robust against race conditions
CREATE OR REPLACE FUNCTION public.generate_record_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_id text;
  counter int := 0;
BEGIN
  LOOP
    -- Generate a new ID with current timestamp and sequence
    new_id := 'LR_' || to_char(now(), 'YYMMDD') || '_' || LPAD(nextval('record_id_seq')::TEXT, 3, '0');
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM investigation_records WHERE record_id = new_id) THEN
      RETURN new_id;
    END IF;
    
    -- Safety counter to prevent infinite loops
    counter := counter + 1;
    IF counter > 100 THEN
      -- Fallback to UUID-based ID if we can't generate a unique sequential ID
      RETURN 'LR_' || to_char(now(), 'YYMMDD') || '_' || SUBSTRING(gen_random_uuid()::text, 1, 8);
    END IF;
  END LOOP;
END;
$function$;

-- Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS set_record_id_trigger ON investigation_records;

CREATE TRIGGER set_record_id_trigger
  BEFORE INSERT ON investigation_records
  FOR EACH ROW
  EXECUTE FUNCTION set_record_id();
