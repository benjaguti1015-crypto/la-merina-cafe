CREATE OR REPLACE FUNCTION public.registro_publico(p_nombre text, p_instagram text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enlace text;
BEGIN
  IF p_nombre IS NULL OR length(btrim(p_nombre)) < 3 OR length(btrim(p_nombre)) > 80 THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;
  IF p_instagram IS NULL OR length(btrim(p_instagram)) < 2 THEN
    RAISE EXCEPTION 'Instagram requerido';
  END IF;

  INSERT INTO public.clientes (nombre_completo, instagram)
  VALUES (btrim(p_nombre), btrim(regexp_replace(p_instagram, '^@', '')))
  RETURNING enlace_unico INTO v_enlace;

  RETURN v_enlace;
END;
$$;

REVOKE ALL ON FUNCTION public.registro_publico(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registro_publico(text, text) TO anon, authenticated;

DROP FUNCTION IF EXISTS public.registro_publico(text, text, text);

CREATE OR REPLACE FUNCTION public.buscar_tarjeta(p_valor text)
RETURNS TABLE(nombre_completo text, enlace_unico text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.nombre_completo, c.enlace_unico
  FROM public.clientes c
  WHERE c.instagram IS NOT NULL
    AND lower(regexp_replace(c.instagram, '^@', '')) = lower(btrim(regexp_replace(coalesce(p_valor, ''), '^@', '')))
  LIMIT 10;
$$;

REVOKE ALL ON FUNCTION public.buscar_tarjeta(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_tarjeta(text) TO anon, authenticated;

ALTER TABLE public.clientes DROP COLUMN IF EXISTS telefono;