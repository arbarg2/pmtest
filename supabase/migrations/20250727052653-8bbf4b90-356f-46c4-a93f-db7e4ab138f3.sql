
-- Create the new cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id TEXT NOT NULL UNIQUE,
  case_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'pending_review', 'cleared', 'str_filed', 'closed', 'on_hold')),
  assigned_to UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  overall_risk_level TEXT CHECK (overall_risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  user_id UUID NOT NULL -- For RLS
);

-- Create case activity log table
CREATE TABLE public.case_activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  activity_description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sequence for case IDs
CREATE SEQUENCE IF NOT EXISTS case_id_seq START 1;

-- Create function to generate case IDs
CREATE OR REPLACE FUNCTION public.generate_case_id_v2()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN 'CASE-' || to_char(now(), 'YYYY') || '-' || LPAD(nextval('case_id_seq')::TEXT, 5, '0');
END;
$$;

-- Create trigger to auto-generate case IDs
CREATE OR REPLACE FUNCTION public.set_case_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.case_id IS NULL OR NEW.case_id = '' THEN
    NEW.case_id := generate_case_id_v2();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_case_id_trigger
  BEFORE INSERT ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_case_id();

-- Add case_id_v2 column to investigation_records to link to new cases table
ALTER TABLE public.investigation_records 
ADD COLUMN IF NOT EXISTS case_id_v2 UUID REFERENCES public.cases(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for cases table
CREATE POLICY "Users can view their own cases"
  ON public.cases
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cases"
  ON public.cases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND auth.uid() = created_by);

CREATE POLICY "Users can update their own cases"
  ON public.cases
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cases"
  ON public.cases
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for case activity log
CREATE POLICY "Users can view activity for their cases"
  ON public.case_activity_log
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cases c 
    WHERE c.id = case_activity_log.case_id 
    AND c.user_id = auth.uid()
  ));

CREATE POLICY "Users can create activity for their cases"
  ON public.case_activity_log
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cases c 
    WHERE c.id = case_activity_log.case_id 
    AND c.user_id = auth.uid()
  ));

-- Create indexes for performance
CREATE INDEX idx_cases_user_id ON public.cases(user_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_assigned_to ON public.cases(assigned_to);
CREATE INDEX idx_cases_created_at ON public.cases(created_at);
CREATE INDEX idx_case_activity_log_case_id ON public.case_activity_log(case_id);
CREATE INDEX idx_investigation_records_case_id_v2 ON public.investigation_records(case_id_v2);
