CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo text NOT NULL,
  enlace_unico text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fidelidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL UNIQUE REFERENCES public.clientes(id) ON DELETE CASCADE,
  sellos_actuales integer NOT NULL DEFAULT 0 CHECK (sellos_actuales >= 0 AND sellos_actuales <= 8),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fidelidad TO authenticated;
GRANT ALL ON public.fidelidad TO service_role;

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelidad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gestionan clientes" ON public.clientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins gestionan fidelidad" ON public.fidelidad FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.crear_fidelidad()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.fidelidad (cliente_id, sellos_actuales) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

CREATE TRIGGER clientes_crear_fidelidad
AFTER INSERT ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.crear_fidelidad();

CREATE OR REPLACE FUNCTION public.tarjeta_publica(p_enlace text)
RETURNS TABLE (nombre_completo text, sellos_actuales integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.nombre_completo, COALESCE(f.sellos_actuales, 0)
  FROM public.clientes c
  LEFT JOIN public.fidelidad f ON f.cliente_id = c.id
  WHERE c.enlace_unico = p_enlace;
$$;

GRANT EXECUTE ON FUNCTION public.tarjeta_publica(text) TO anon, authenticated;