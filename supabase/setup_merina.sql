-- =====================================================================
-- La Merina Café · Tarjeta de fidelidad (10 sellos)
-- Pega TODO este archivo en Supabase > SQL Editor > New query > Run.
-- Es para un proyecto de Supabase NUEVO y vacío. Se puede correr una vez.
-- =====================================================================

-- ---------- Tablas ----------
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo text NOT NULL,
  instagram text,
  cumpleanos text, -- formato dd/mm/aaaa
  enlace_unico text NOT NULL UNIQUE DEFAULT replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.fidelidad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL UNIQUE REFERENCES public.clientes(id) ON DELETE CASCADE,
  sellos_actuales integer NOT NULL DEFAULT 0
    CONSTRAINT fidelidad_sellos_actuales_check CHECK (sellos_actuales >= 0 AND sellos_actuales <= 10),
  ultimo_sello_en timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.configuracion (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  acumulacion_activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.configuracion (id, acumulacion_activa) VALUES (true, true);

-- Avisos push: una fila por dispositivo que activó los avisos.
CREATE TABLE public.suscripciones_push (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- Permisos y seguridad (RLS) ----------
-- Solo el admin (usuario con sesión iniciada) lee y edita tablas directo.
-- Los clientes (anon) solo usan las funciones públicas de más abajo.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fidelidad TO authenticated;
GRANT SELECT ON public.configuracion TO anon;
GRANT SELECT, INSERT, UPDATE ON public.configuracion TO authenticated;
GRANT SELECT, DELETE ON public.suscripciones_push TO authenticated;
GRANT ALL ON public.clientes, public.fidelidad, public.configuracion, public.suscripciones_push TO service_role;

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fidelidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones_push ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins gestionan clientes" ON public.clientes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins gestionan fidelidad" ON public.fidelidad
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Configuracion visible para todos" ON public.configuracion
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins actualizan configuracion" ON public.configuracion
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admins insertan configuracion" ON public.configuracion
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins leen suscripciones" ON public.suscripciones_push
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins borran suscripciones" ON public.suscripciones_push
  FOR DELETE TO authenticated USING (true);

-- ---------- Triggers ----------
-- Cada cliente nuevo nace con su tarjeta en 0 sellos.
CREATE OR REPLACE FUNCTION public.crear_fidelidad()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.fidelidad (cliente_id, sellos_actuales) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.crear_fidelidad() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER clientes_crear_fidelidad
AFTER INSERT ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.crear_fidelidad();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER configuracion_updated_at BEFORE UPDATE ON public.configuracion
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- Funciones públicas (clientes) ----------
-- Registro desde /registro. Devuelve el enlace único de la tarjeta.
CREATE OR REPLACE FUNCTION public.registro_publico(
  p_nombre text,
  p_instagram text,
  p_cumpleanos text DEFAULT NULL
)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_enlace text;
  v_cumple text := nullif(btrim(coalesce(p_cumpleanos, '')), '');
BEGIN
  IF p_nombre IS NULL OR length(btrim(p_nombre)) < 3 OR length(btrim(p_nombre)) > 80 THEN
    RAISE EXCEPTION 'Nombre inválido';
  END IF;
  IF p_instagram IS NULL OR length(btrim(p_instagram)) < 2 OR length(btrim(p_instagram)) > 50 THEN
    RAISE EXCEPTION 'Instagram requerido';
  END IF;
  IF v_cumple IS NOT NULL AND v_cumple !~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
    v_cumple := NULL;
  END IF;

  INSERT INTO public.clientes (nombre_completo, instagram, cumpleanos)
  VALUES (btrim(p_nombre), btrim(regexp_replace(p_instagram, '^@', '')), v_cumple)
  RETURNING enlace_unico INTO v_enlace;

  RETURN v_enlace;
END;
$$;
REVOKE ALL ON FUNCTION public.registro_publico(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registro_publico(text, text, text) TO anon, authenticated;

-- Datos de una tarjeta por su enlace (página /t/...).
CREATE OR REPLACE FUNCTION public.tarjeta_publica(p_enlace text)
RETURNS TABLE(
  nombre_completo text,
  sellos_actuales integer,
  instagram text,
  cumpleanos text,
  enlace_unico text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.nombre_completo,
         COALESCE(f.sellos_actuales, 0)::integer,
         c.instagram,
         c.cumpleanos,
         c.enlace_unico
  FROM public.clientes c
  LEFT JOIN public.fidelidad f ON f.cliente_id = c.id
  WHERE c.enlace_unico = p_enlace
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.tarjeta_publica(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tarjeta_publica(text) TO anon, authenticated;

-- El cliente agrega su cumpleaños desde su tarjeta (solo si aún no tiene).
CREATE OR REPLACE FUNCTION public.actualizar_cumpleanos_publico(p_enlace text, p_cumpleanos text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_cumpleanos IS NULL OR p_cumpleanos !~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN
    RETURN false;
  END IF;

  UPDATE public.clientes
  SET cumpleanos = p_cumpleanos
  WHERE enlace_unico = p_enlace AND cumpleanos IS NULL;

  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.actualizar_cumpleanos_publico(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.actualizar_cumpleanos_publico(text, text) TO anon, authenticated;

-- Buscar tarjeta por usuario de Instagram (página /mi-tarjeta).
CREATE OR REPLACE FUNCTION public.buscar_tarjeta(p_valor text)
RETURNS TABLE(nombre_completo text, enlace_unico text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.nombre_completo, c.enlace_unico
  FROM public.clientes c
  WHERE c.instagram IS NOT NULL
    AND lower(regexp_replace(c.instagram, '^@', '')) = lower(btrim(regexp_replace(coalesce(p_valor, ''), '^@', '')))
  LIMIT 10;
$$;
REVOKE ALL ON FUNCTION public.buscar_tarjeta(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.buscar_tarjeta(text) TO anon, authenticated;

-- Guardar el dispositivo que activó los avisos push.
CREATE OR REPLACE FUNCTION public.guardar_suscripcion_push(
  p_enlace text,
  p_endpoint text,
  p_p256dh text,
  p_auth text
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- ---------- Función del admin ----------
-- Suma (+1) o quita (-1) un sello. Tope: 10.
CREATE OR REPLACE FUNCTION public.ajustar_sellos(p_cliente_id uuid, p_delta integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

  SELECT c.acumulacion_activa INTO v_activa FROM public.configuracion c LIMIT 1;
  IF p_delta = 1 AND COALESCE(v_activa, true) = false THEN
    RAISE EXCEPTION 'Acumulación de sellos pausada temporalmente';
  END IF;

  INSERT INTO public.fidelidad (cliente_id, sellos_actuales)
  VALUES (p_cliente_id, 0)
  ON CONFLICT (cliente_id) DO NOTHING;

  UPDATE public.fidelidad
  SET sellos_actuales = LEAST(10, GREATEST(0, sellos_actuales + p_delta)),
      updated_at = now(),
      ultimo_sello_en = CASE WHEN p_delta = 1 THEN now() ELSE ultimo_sello_en END
  WHERE cliente_id = p_cliente_id
  RETURNING sellos_actuales INTO v_nuevo;

  IF v_nuevo IS NULL THEN
    RAISE EXCEPTION 'Cliente sin tarjeta';
  END IF;

  RETURN v_nuevo;
END;
$$;
REVOKE ALL ON FUNCTION public.ajustar_sellos(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ajustar_sellos(uuid, integer) TO authenticated;
