-- Respaldo del consentimiento del registro: cuándo aceptó los términos y si aceptó avisos.
-- Solo agrega columnas: los clientes existentes quedan en NULL / false.
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS terminos_aceptados_en timestamptz,
  ADD COLUMN IF NOT EXISTS acepta_avisos boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.registrar_consentimiento(p_enlace text, p_acepta_avisos boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.clientes
     SET terminos_aceptados_en = now(),
         acepta_avisos = COALESCE(p_acepta_avisos, false)
   WHERE enlace_unico = p_enlace
     AND terminos_aceptados_en IS NULL;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.registrar_consentimiento(text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_consentimiento(text, boolean) TO anon, authenticated;
