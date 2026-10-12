-- Avisos push: una fila por dispositivo que activó los avisos.
CREATE TABLE public.suscripciones_push (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suscripciones_push ENABLE ROW LEVEL SECURITY;

-- Los clientes (anon) no leen ni escriben la tabla directo: solo por la función de abajo.
GRANT SELECT, DELETE ON public.suscripciones_push TO authenticated;
GRANT ALL ON public.suscripciones_push TO service_role;

CREATE POLICY "Admins leen suscripciones" ON public.suscripciones_push
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins borran suscripciones" ON public.suscripciones_push
  FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.guardar_suscripcion_push(
  p_enlace text,
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cliente uuid;
BEGIN
  IF p_endpoint !~ '^https://' OR length(p_endpoint) > 1000
     OR length(p_p256dh) > 200 OR length(p_auth) > 100 THEN
    RETURN false;
  END IF;

  SELECT id INTO v_cliente FROM public.clientes WHERE enlace_unico = p_enlace;
  IF v_cliente IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.suscripciones_push (cliente_id, endpoint, p256dh, auth)
  VALUES (v_cliente, p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (endpoint) DO UPDATE
    SET cliente_id = EXCLUDED.cliente_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.guardar_suscripcion_push(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.guardar_suscripcion_push(text, text, text, text) TO anon, authenticated;
