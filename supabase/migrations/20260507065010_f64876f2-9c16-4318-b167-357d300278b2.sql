
DROP INDEX IF EXISTS public.public_checks_address_network_key;
ALTER TABLE public.public_checks ADD CONSTRAINT public_checks_address_network_uniq UNIQUE (address, network);
