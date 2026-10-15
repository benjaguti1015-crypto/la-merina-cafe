import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Mensaje que aparece arriba en todas las tarjetas. Llega también a quien no activó avisos.
export function EditarMensaje() {
  const qc = useQueryClient();
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: actual = null } = useQuery({
    queryKey: ["mensaje"],
    queryFn: async () => {
      const { data, error } = await supabase.from("configuracion").select("mensaje").maybeSingle();
      if (error) throw error;
      return data?.mensaje ?? null;
    },
  });

  const guardar = useMutation({
    mutationFn: async (mensaje: string | null) => {
      const { error } = await supabase.from("configuracion").update({ mensaje }).eq("id", true);
      if (error) throw error;
      return mensaje;
    },
    onMutate: () => setError(null),
    onSuccess: (mensaje) => {
      qc.setQueryData(["mensaje"], mensaje);
      setTexto("");
    },
    onError: () => setError("No se pudo guardar el mensaje. Inténtalo de nuevo."),
  });

  return (
    <details className="mt-3 rounded-2xl bg-white px-4 py-3 shadow-card">
      <summary className="cursor-pointer text-sm font-semibold text-primary">
        📣 Mensaje en la tarjeta{" "}
        <span className="font-normal text-muted-foreground">
          ({actual ? "publicado" : "sin mensaje"})
        </span>
      </summary>
      <div className="mt-3 space-y-3">
        {actual && (
          <div className="rounded-xl bg-arena-suave px-3 py-2 text-sm text-primary">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Ahora se ve
            </p>
            <p className="mt-0.5">{actual}</p>
            <button
              type="button"
              onClick={() => guardar.mutate(null)}
              disabled={guardar.isPending}
              className="mt-2 text-xs font-semibold text-destructive underline disabled:opacity-60"
            >
              Quitar mensaje
            </button>
          </div>
        )}
        <textarea
          aria-label="Nuevo mensaje para las tarjetas"
          value={texto}
          maxLength={140}
          rows={2}
          placeholder="Ej: ☕ Hoy 2x1 en capuchino hasta las 18:00"
          onChange={(e) => setTexto(e.target.value)}
          className="w-full rounded-xl border border-primary/30 bg-crema px-3 py-2.5 text-base text-primary outline-none focus:border-primary"
        />
        <button
          type="button"
          disabled={!texto.trim() || guardar.isPending}
          onClick={() => guardar.mutate(texto.trim())}
          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {guardar.isPending ? "Publicando…" : actual ? "Reemplazar mensaje" : "Publicar mensaje"}
        </button>
        <p className="text-xs text-muted-foreground">
          Lo ven todos los clientes al abrir su tarjeta, también en iPhone. {texto.length}/140
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </details>
  );
}
