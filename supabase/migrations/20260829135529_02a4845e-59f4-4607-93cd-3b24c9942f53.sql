CREATE TABLE public.configuracion (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  acumulacion_activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.configuracion TO anon;
GRANT SELECT, INSERT, UPDATE ON public.configuracion TO authenticated;
GRANT ALL ON public.configuracion TO service_role;

ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Configuracion visible para todos" ON public.configuracion FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins actualizan configuracion" ON public.configuracion FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins insertan configuracion" ON public.configuracion FOR INSERT TO authenticated WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER configuracion_updated_at BEFORE UPDATE ON public.configuracion
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.configuracion (id, acumulacion_activa) VALUES (true, true);

CREATE OR REPLACE FUNCTION public.ajustar_sellos(p_cliente_id uuid, p_delta integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_nuevo integer;
  v_activa boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_delta IS NULL OR p_delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Ajuste inválido';
  END IF;

  SELECT acumulacion_activa INTO v_activa FROM public.configuracion WHERE id;

  IF p_delta = 1 AND COALESCE(v_activa, true) = false THEN
    RAISE EXCEPTION 'Acumulación de sellos pausada por falta de stock temporal';
  END IF;

  INSERT INTO public.fidelidad (cliente_id, sellos_actuales)
  VALUES (p_cliente_id, 0)
  ON CONFLICT (cliente_id) DO NOTHING;

  UPDATE public.fidelidad
  SET sellos_actuales = LEAST(8, GREATEST(0, sellos_actuales + p_delta)),
      updated_at = now()
  WHERE cliente_id = p_cliente_id
  RETURNING sellos_actuales INTO v_nuevo;

  IF v_nuevo IS NULL THEN
    RAISE EXCEPTION 'Cliente sin tarjeta';
  END IF;

  RETURN v_nuevo;
END;
$function$;