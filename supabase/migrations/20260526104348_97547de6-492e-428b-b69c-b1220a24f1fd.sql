
-- Revoke execute from anon/authenticated/public for SECURITY DEFINER trigger functions
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Hide tables from anon GraphQL/REST (RLS still required for authenticated)
REVOKE SELECT ON public.analyses FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
