
-- Create investigation_records table
CREATE TABLE public.investigation_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL CHECK (network IN ('BTC', 'ETH')),
  risk_score DECIMAL(3,1) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 10),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better query performance
CREATE INDEX idx_investigation_records_user_id ON public.investigation_records(user_id);
CREATE INDEX idx_investigation_records_record_id ON public.investigation_records(record_id);
CREATE INDEX idx_investigation_records_created_at ON public.investigation_records(created_at);

-- Enable Row Level Security
ALTER TABLE public.investigation_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user data separation
CREATE POLICY "Users can view their own investigation records" 
  ON public.investigation_records 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investigation records" 
  ON public.investigation_records 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investigation records" 
  ON public.investigation_records 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investigation records" 
  ON public.investigation_records 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Function to generate unique record IDs
CREATE OR REPLACE FUNCTION generate_record_id()
RETURNS TEXT AS $$
BEGIN
  RETURN 'LR_' || to_char(now(), 'YYMMDD') || '_' || LPAD(nextval('record_id_seq')::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Create sequence for record ID generation
CREATE SEQUENCE IF NOT EXISTS record_id_seq START 1;

-- Trigger to auto-generate record_id
CREATE OR REPLACE FUNCTION set_record_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.record_id IS NULL OR NEW.record_id = '' THEN
    NEW.record_id := generate_record_id();
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_record_id
  BEFORE INSERT OR UPDATE ON public.investigation_records
  FOR EACH ROW EXECUTE FUNCTION set_record_id();
