-- Create function to reload PostgREST schema cache
CREATE OR REPLACE FUNCTION notify_pgrst_reload()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION notify_pgrst_reload() TO service_role;