CREATE OR REPLACE FUNCTION public.buscar_tarjeta(p_valor text)
RETURNS TABLE(nombre_completo text, enlace_unico text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.nombre_completo, c.enlace_unico
  FROM public.clientes c
  WHERE length(btrim(coalesce(p_valor,''))) >= 3
    AND (
      lower(btrim(c.instagram)) = lower(btrim(ltrim(p_valor, '@')))
      OR regexp_replace(coalesce(c.telefono,''), '\D', '', 'g') = regexp_replace(p_valor, '\D', '', 'g')
      AND regexp_replace(p_valor, '\D', '', 'g') <> ''
    )
  ORDER BY c.created_at DESC
  LIMIT 5;
$$;

REVOKE ALL ON FUNCTION public.buscar_tarjeta(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_tarjeta(text) TO anon, authenticated;