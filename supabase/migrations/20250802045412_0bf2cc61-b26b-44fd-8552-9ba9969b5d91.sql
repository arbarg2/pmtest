-- Update the network check constraint to include solana
ALTER TABLE investigation_records DROP CONSTRAINT IF EXISTS investigation_records_network_check;
ALTER TABLE investigation_records ADD CONSTRAINT investigation_records_network_check 
CHECK (network IN ('bitcoin', 'ethereum', 'solana', 'BTC', 'ETH', 'SOL', 'btc', 'eth', 'sol'));