import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { esHoyCumpleanos } from "@/components/CampoCumpleanos";
import { META, PREMIOS } from "@/lib/marca";

const campo =
  "w-full rounded-xl border border-primary/30 bg-crema px-3 py-2.5 text-base text-primary outline-none focus:border-primary";

type ClienteAviso = {
  id: string;
  nombre_completo: string;
  instagram: string | null;
  cumpleanos: string | null;
  sellos: number;
};

const GRUPOS = {
  todos: "Todos",
  cumple: "🎂 De cumpleaños hoy",
  premio: "⭐ A 1 sello de un premio",
  completa: "🏆 Con la tarjeta completa",
  elegir: "👆 Elegir clientes",
} as const;
type Grupo = keyof typeof GRUPOS;

function enGrupo(grupo: Grupo, c: ClienteAviso) {
  if (grupo === "cumple") return esHoyCumpleanos(c.cumpleanos);
  if (grupo === "premio") return Boolean(PREMIOS[c.sellos + 1]);
  if (grupo === "completa") return c.sellos === META;
  return true;
}

export function EnviarAviso({ clientes }: { clientes: ClienteAviso[] }) {
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [grupo, setGrupo] = useState<Grupo>("todos");
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  // Solo se puede avisar a quien activó los avisos en su celular.
  const { data: conAvisos = new Set<string>() } = useQuery({
    queryKey: ["suscripciones_push"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suscripciones_push").select("cliente_id");
      if (error) throw error;
      return new Set((data ?? []).map((s) => s.cliente_id));
    },
    refetchInterval: 30000,
  });

  const candidatos = useMemo(
    () => clientes.filter((c) => conAvisos.has(c.id)),
    [clientes, conAvisos],
  );
  const destinatarios =
    grupo === "elegir"
      ? candidatos.filter((c) => elegidos.has(c.id))
      : candidatos.filter((c) => enGrupo(grupo, c));

  const visiblesParaElegir = useMemo(() => {
    const q = busqueda.trim().toLowerCase().replace(/^@/, "");
    if (!q) return candidatos;
    return candidatos.filter(
      (c) =>
        c.nombre_completo.toLowerCase().includes(q) ||
        (c.instagram ?? "").toLowerCase().includes(q),
    );
  }, [candidatos, busqueda]);

  function alternar(id: string) {
    setElegidos((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

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
      body: JSON.stringify({
        titulo,
        texto,
        // Sin lista = todos los que tienen avisos activos.
        clientes: grupo === "todos" ? undefined : destinatarios.map((c) => c.id),
      }),
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

  const listo = titulo.trim() && texto.trim() && destinatarios.length > 0;

  return (
    <details className="mt-3 rounded-2xl bg-white px-4 py-3 shadow-card">
      <summary className="cursor-pointer text-sm font-semibold text-primary">
        🔔 Enviar aviso{" "}
        <span className="font-normal text-muted-foreground">
          ({candidatos.length} con avisos activos)
        </span>
      </summary>
      <div className="mt-3 space-y-3">
        <fieldset>
          <legend className="text-xs font-semibold text-primary">¿A quién?</legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {(Object.keys(GRUPOS) as Grupo[]).map((g) => {
              const cuantos =
                g === "elegir" ? elegidos.size : candidatos.filter((c) => enGrupo(g, c)).length;
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={grupo === g}
                  onClick={() => {
                    setGrupo(g);
                    setConfirmando(false);
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-[transform,background-color] duration-150 active:scale-[0.97] ${
                    grupo === g
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-primary/25 bg-white text-primary"
                  }`}
                >
                  {GRUPOS[g]} ({cuantos})
                </button>
              );
            })}
          </div>
        </fieldset>

        {grupo === "elegir" && (
          <div className="rounded-xl border border-primary/15 p-2">
            <input
              aria-label="Buscar cliente para el aviso"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o @Instagram…"
              className={campo}
            />
            <ul className="mt-2 max-h-48 space-y-0.5 overflow-y-auto">
              {visiblesParaElegir.length === 0 && (
                <li className="px-2 py-1 text-xs text-muted-foreground">
                  Nadie con avisos activos coincide.
                </li>
              )}
              {visiblesParaElegir.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm text-primary">
                    <input
                      type="checkbox"
                      checked={elegidos.has(c.id)}
                      onChange={() => alternar(c.id)}
                      className="h-5 w-5 shrink-0 accent-primary"
                    />
                    <span className="min-w-0 truncate">
                      {c.nombre_completo}
                      {c.instagram && (
                        <span className="text-muted-foreground">
                          {" "}
                          · @{c.instagram.replace(/^@/, "")}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

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
              {enviando ? "Enviando…" : `Confirmar (${destinatarios.length})`}
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={!listo}
            onClick={() => setConfirmando(true)}
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            Enviar a {destinatarios.length} {destinatarios.length === 1 ? "cliente" : "clientes"}
          </button>
        )}
        {candidatos.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Aún nadie activó los avisos. Se activan desde la tarjeta del cliente.
          </p>
        )}
        {candidatos.length > 0 && destinatarios.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nadie con avisos activos está en este grupo.
          </p>
        )}
        {resultado && <p className="text-sm font-semibold text-primary">{resultado}</p>}
      </div>
    </details>
  );
}
