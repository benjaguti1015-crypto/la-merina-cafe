DROP FUNCTION IF EXISTS public.tarjeta_publica(text);

CREATE OR REPLACE FUNCTION public.tarjeta_publica(p_enlace text)
RETURNS TABLE(nombre_completo text, sellos_actuales integer, instagram text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.nombre_completo,
         COALESCE(f.sellos_actuales, 0)::integer,
         c.instagram
  FROM public.clientes c
  LEFT JOIN public.fidelidad f ON f.cliente_id = c.id
  WHERE c.enlace_unico = p_enlace
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.tarjeta_publica(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tarjeta_publica(text) TO anon, authenticated;