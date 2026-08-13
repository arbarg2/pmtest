GRANT SELECT ON public.health_reports TO anon, authenticated;
GRANT ALL ON public.health_reports TO service_role;
GRANT SELECT ON public.public_checks TO anon, authenticated;
GRANT ALL ON public.public_checks TO service_role;