-- Mensaje que el admin publica y que se ve en todas las tarjetas (promos del día).
-- Usa la fila única de configuracion: los clientes (anon) ya pueden leerla
-- y el admin ya puede editarla, así que no hacen falta permisos nuevos.
ALTER TABLE public.configuracion
  ADD COLUMN IF NOT EXISTS mensaje text CHECK (char_length(mensaje) <= 140);
