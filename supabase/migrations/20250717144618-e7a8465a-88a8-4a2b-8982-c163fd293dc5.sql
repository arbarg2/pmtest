
-- Add AI summary columns to investigation_records table
ALTER TABLE public.investigation_records 
ADD COLUMN ai_summary TEXT,
ADD COLUMN ai_summary_previous TEXT,
ADD COLUMN ai_summary_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN ai_summary_status TEXT DEFAULT 'pending';

-- Create an index for faster lookups by record_id
CREATE INDEX IF NOT EXISTS idx_investigation_records_record_id ON public.investigation_records(record_id);

-- Add a comment to document the new columns
COMMENT ON COLUMN public.investigation_records.ai_summary IS 'Current AI-generated summary of the wallet investigation';
COMMENT ON COLUMN public.investigation_records.ai_summary_previous IS 'Previous AI summary for comparison purposes';
COMMENT ON COLUMN public.investigation_records.ai_summary_generated_at IS 'Timestamp when the AI summary was last generated';
COMMENT ON COLUMN public.investigation_records.ai_summary_status IS 'Status of AI summary generation: pending, processing, completed, failed';
