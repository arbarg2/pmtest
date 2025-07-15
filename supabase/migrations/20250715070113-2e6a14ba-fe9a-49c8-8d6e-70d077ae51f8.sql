
-- Add new columns to support case management
ALTER TABLE public.investigation_records 
ADD COLUMN IF NOT EXISTS is_case BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS case_id TEXT,
ADD COLUMN IF NOT EXISTS case_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS case_status TEXT DEFAULT 'open' CHECK (case_status IN ('open', 'escalated', 'cleared', 'closed'));

-- Create index for better performance on case queries
CREATE INDEX IF NOT EXISTS idx_investigation_records_is_case ON public.investigation_records(is_case);
CREATE INDEX IF NOT EXISTS idx_investigation_records_case_status ON public.investigation_records(case_status);

-- Function to generate case ID
CREATE OR REPLACE FUNCTION generate_case_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'CASE_' || to_char(now(), 'YYMMDD') || '_' || LPAD(nextval('case_id_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for case ID generation
CREATE SEQUENCE IF NOT EXISTS case_id_seq START 1;

-- Create audit log table for case events
CREATE TABLE IF NOT EXISTS public.case_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log table
ALTER TABLE public.case_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit log
CREATE POLICY "Users can view audit logs for their cases" 
  ON public.case_audit_log 
  FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.investigation_records ir WHERE ir.case_id = case_audit_log.case_id AND ir.user_id = auth.uid()));

CREATE POLICY "Users can create audit logs for their cases" 
  ON public.case_audit_log 
  FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.investigation_records ir WHERE ir.case_id = case_audit_log.case_id AND ir.user_id = auth.uid()));
