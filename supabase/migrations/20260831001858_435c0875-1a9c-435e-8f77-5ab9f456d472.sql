ALTER TABLE public.fidelidad ADD COLUMN IF NOT EXISTS ultimo_sello_en timestamptz;

CREATE OR REPLACE FUNCTION public.ajustar_sellos(p_cliente_id uuid, p_delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nuevo integer;
  v_activa boolean;
  v_ultimo timestamptz;
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

  SELECT ultimo_sello_en INTO v_ultimo FROM public.fidelidad WHERE cliente_id = p_cliente_id;

  IF p_delta = 1 AND v_ultimo IS NOT NULL
     AND (v_ultimo AT TIME ZONE 'America/Santiago')::date = (now() AT TIME ZONE 'America/Santiago')::date THEN
    RAISE EXCEPTION 'Este cliente ya recibió su sello de hoy (límite: 1 sello por día)';
  END IF;

  UPDATE public.fidelidad
  SET sellos_actuales = LEAST(8, GREATEST(0, sellos_actuales + p_delta)),
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