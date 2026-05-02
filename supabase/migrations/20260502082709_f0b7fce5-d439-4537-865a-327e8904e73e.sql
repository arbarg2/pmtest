ALTER PUBLICATION supabase_realtime ADD TABLE public.watch_alerts;
ALTER TABLE public.watch_alerts REPLICA IDENTITY FULL;