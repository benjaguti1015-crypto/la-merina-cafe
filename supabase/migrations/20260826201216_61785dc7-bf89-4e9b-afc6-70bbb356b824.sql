ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS telefono text;

CREATE OR REPLACE FUNCTION public.registro_publico(
  p_nombre text,
  p_instagram text DEFAULT NULL,
  p_telefono text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nombre text := btrim(p_nombre);
  v_ig text := nullif(btrim(coalesce(p_instagram, '')), '');
  v_tel text := nullif(btrim(coalesce(p_telefono, '')), '');
  v_enlace text;
BEGIN
  IF length(v_nombre) < 3 OR length(v_nombre) > 80 THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;
  IF v_ig IS NULL AND v_tel IS NULL THEN
    RAISE EXCEPTION 'Debes indicar Instagram o teléfono';
  END IF;
  IF v_ig IS NOT NULL AND length(v_ig) > 50 THEN
    RAISE EXCEPTION 'Instagram inválido';
  END IF;
  IF v_tel IS NOT NULL AND length(v_tel) > 25 THEN
    RAISE EXCEPTION 'Teléfono inválido';
  END IF;

  INSERT INTO public.clientes (nombre_completo, instagram, telefono)
  VALUES (v_nombre, v_ig, v_tel)
  RETURNING enlace_unico INTO v_enlace;

  RETURN v_enlace;
END;
$$;

REVOKE ALL ON FUNCTION public.registro_publico(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registro_publico(text, text, text) TO anon, authenticated;