
-- First, let's see what the current constraint allows
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'investigation_records_network_check';

-- Check what network values are currently in the table
SELECT DISTINCT network FROM investigation_records;

-- Based on common blockchain naming conventions, the constraint likely expects:
-- 'ethereum' and 'bitcoin' OR 'ETH' and 'BTC'
-- Let's update the constraint to allow both ethereum/bitcoin and ETH/BTC formats

ALTER TABLE investigation_records 
DROP CONSTRAINT IF EXISTS investigation_records_network_check;

-- Add a more flexible constraint that accepts common network identifiers
ALTER TABLE investigation_records 
ADD CONSTRAINT investigation_records_network_check 
CHECK (network IN ('ethereum', 'bitcoin', 'ETH', 'BTC', 'eth', 'btc'));
