CREATE OR REPLACE FUNCTION public.ajustar_sellos(p_cliente_id uuid, p_delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_nuevo integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  IF p_delta IS NULL OR p_delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Ajuste inválido';
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
$$;

REVOKE ALL ON FUNCTION public.ajustar_sellos(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ajustar_sellos(uuid, integer) TO authenticated;