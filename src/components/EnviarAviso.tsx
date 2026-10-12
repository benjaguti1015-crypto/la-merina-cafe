import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const campo =
  "w-full rounded-xl border border-primary/30 bg-crema px-3 py-2.5 text-base text-primary outline-none focus:border-primary";

export function EnviarAviso() {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const { data: activos = 0 } = useQuery({
    queryKey: ["suscripciones_push"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("suscripciones_push")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  async function enviar() {
    setEnviando(true);
    setResultado(null);
    const { data } = await supabase.auth.getSession();
    const resp = await fetch("/api/enviar-aviso", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${data.session?.access_token ?? ""}`,
      },
      body: JSON.stringify({ titulo, texto }),
    }).catch(() => null);
    const cuerpo = (await resp?.json().catch(() => null)) as {
      enviados?: number;
      total?: number;
      error?: string;
    } | null;
    setEnviando(false);
    setConfirmando(false);

    if (!resp?.ok) {
      setResultado(cuerpo?.error ?? "No se pudo enviar. Inténtalo de nuevo.");
      return;
    }
    setResultado(`Enviado a ${cuerpo?.enviados} de ${cuerpo?.total} dispositivos.`);
    setTitulo("");
    setTexto("");
  }

  const listo = titulo.trim() && texto.trim() && activos > 0;

  return (
    <details className="mt-3 rounded-2xl bg-white px-4 py-3 shadow-card">
      <summary className="cursor-pointer text-sm font-semibold text-primary">
        🔔 Enviar aviso{" "}
        <span className="font-normal text-muted-foreground">({activos} con avisos activos)</span>
      </summary>
      <div className="mt-3 space-y-3">
        <input
          aria-label="Título del aviso"
          value={titulo}
          maxLength={60}
          placeholder="Título (ej: Nuevo café de origen)"
          onChange={(e) => setTitulo(e.target.value)}
          className={campo}
        />
        <textarea
          aria-label="Texto del aviso"
          value={texto}
          maxLength={200}
          rows={3}
          placeholder="Mensaje corto y directo"
          onChange={(e) => setTexto(e.target.value)}
          className={campo}
        />
        {confirmando ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="flex-1 rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={enviar}
              disabled={enviando}
              className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60"
            >
              {enviando ? "Enviando…" : `Confirmar envío (${activos})`}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!listo}
            onClick={() => setConfirmando(true)}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Enviar aviso
          </button>
        )}
        {activos === 0 && (
          <p className="text-xs text-muted-foreground">
            Aún nadie activó los avisos. Se activan desde la tarjeta del cliente.
          </p>
        )}
        {resultado && <p className="text-sm font-semibold text-primary">{resultado}</p>}
      </div>
    </details>
  );
}
