import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MARCA, MARCA_COMPLETA } from "@/lib/marca";

export const Route = createFileRoute("/mi-tarjeta")({
  head: () => ({
    meta: [
      { title: `Ver mi tarjeta | ${MARCA_COMPLETA}` },
      {
        name: "description",
        content:
          "Recupera tu tarjeta de fidelidad con tu usuario de Instagram y revisa tus sellos.",
      },
      { property: "og:title", content: `Ver mi tarjeta | ${MARCA_COMPLETA}` },
      {
        property: "og:description",
        content: "Recupera tu tarjeta de fidelidad y revisa cuántos sellos llevas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MiTarjeta,
});

type Resultado = { nombre_completo: string; enlace_unico: string };

function MiTarjeta() {
  const navigate = useNavigate();
  const [valor, setValor] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [guardada, setGuardada] = useState<string | null>(null);
  const [enlaceInput, setEnlaceInput] = useState("");
  const [errorEnlace, setErrorEnlace] = useState<string | null>(null);

  function abrirEnlace(e: React.FormEvent) {
    e.preventDefault();
    setErrorEnlace(null);
    const bruto = enlaceInput.trim();
    const match = bruto.match(/([0-9a-fA-F]{32})/) ?? bruto.match(/\/t\/([^/?#\s]+)/);
    const codigo = match?.[1];
    if (!codigo) {
      setErrorEnlace("Pega el enlace completo o el código de tu tarjeta.");
      return;
    }
    navigate({ to: "/t/$enlace", params: { enlace: codigo } });
  }

  useEffect(() => {
    setGuardada(localStorage.getItem("tarjeta_enlace"));
  }, []);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResultados(null);

    if (valor.trim().replace(/^@/, "").length < 2) {
      setError("Escribe tu usuario de Instagram.");
      return;
    }

    setBuscando(true);
    const { data, error: err } = await supabase.rpc("buscar_tarjeta", {
      p_valor: valor.trim().replace(/^@/, ""),
    });
    setBuscando(false);

    if (err) {
      setError("No pudimos buscar tu tarjeta. Inténtalo de nuevo.");
      return;
    }
    const filas = (data ?? []) as Resultado[];
    if (filas.length === 0) {
      setError("No encontramos ninguna tarjeta con ese Instagram. ¿Ya te registraste?");
      return;
    }
    if (filas.length === 1) {
      navigate({ to: "/t/$enlace", params: { enlace: filas[0]!.enlace_unico } });
      return;
    }
    setResultados(filas);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-primary/15 bg-card p-6 shadow-card">
        <img
          src="/logo.png"
          alt={`Logo ${MARCA}`}
          className="mx-auto h-24 w-24 rounded-full ring-4 ring-arena"
        />
        <h1 className="mt-3 text-center text-xl leading-tight text-primary">Ver mi tarjeta</h1>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Con tu usuario de Instagram
        </p>

        {guardada && (
          <Link
            to="/t/$enlace"
            params={{ enlace: guardada }}
            className="mt-5 block rounded-xl bg-primary px-4 py-3 text-center font-semibold text-primary-foreground"
          >
            Abrir mi tarjeta guardada
          </Link>
        )}

        <form onSubmit={buscar}>
          <label className="mt-5 block text-sm font-semibold text-primary" htmlFor="valor">
            Usuario de Instagram
          </label>
          <input
            id="valor"
            value={valor}
            maxLength={50}
            onChange={(e) => setValor(e.target.value)}
            placeholder="@tuusuario"
            className="mt-1 w-full rounded-xl border-2 border-primary/40 bg-crema px-3 py-2 text-primary outline-none focus:border-primary"
          />

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={buscando}
            className="mt-5 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {buscando ? "Buscando…" : "Buscar mi tarjeta"}
          </button>
        </form>

        {resultados && resultados.length > 1 && (
          <div className="mt-5 space-y-2">
            <p className="text-sm text-muted-foreground">Encontramos varias tarjetas:</p>
            {resultados.map((r) => (
              <Link
                key={r.enlace_unico}
                to="/t/$enlace"
                params={{ enlace: r.enlace_unico }}
                className="block rounded-xl border-2 border-primary/40 px-3 py-2 text-sm font-semibold text-primary"
              >
                {r.nombre_completo}
              </Link>
            ))}
          </div>
        )}

        <form onSubmit={abrirEnlace} className="mt-6 border-t border-primary/20 pt-5">
          <label className="block text-sm font-semibold text-primary" htmlFor="enlace">
            ¿Tienes tu enlace único?
          </label>
          <input
            id="enlace"
            value={enlaceInput}
            onChange={(e) => setEnlaceInput(e.target.value)}
            placeholder="Pega aquí tu enlace o código"
            className="mt-1 w-full rounded-xl border-2 border-primary/40 bg-crema px-3 py-2 text-primary outline-none focus:border-primary"
          />
          {errorEnlace && <p className="mt-2 text-sm text-destructive">{errorEnlace}</p>}
          <button
            type="submit"
            className="mt-3 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ver mi tarjeta al instante
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          ¿Todavía no tienes tarjeta?{" "}
          <Link to="/registro" className="font-semibold text-primary underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </main>
  );
}
