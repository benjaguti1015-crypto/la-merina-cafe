import { useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Terminos } from "@/components/Terminos";
import { CampoCumpleanos, type Cumple } from "@/components/CampoCumpleanos";
import { MARCA, MARCA_COMPLETA, META } from "@/lib/marca";
import { guardarSuscripcion, pedirSuscripcion } from "@/lib/avisos";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: `Crea tu tarjeta | ${MARCA_COMPLETA}` },
      {
        name: "description",
        content: `Regístrate con tu nombre, tu usuario de Instagram y tu cumpleaños para recibir tu tarjeta de fidelidad de ${META} sellos.`,
      },
      { property: "og:title", content: `Crea tu tarjeta | ${MARCA_COMPLETA}` },
      {
        property: "og:description",
        content: "Crea tu tarjeta de fidelidad en segundos y empieza a juntar sellos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Registro,
});

function Registro() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [instagram, setInstagram] = useState("");
  const [cumpleanos, setCumpleanos] = useState<Cumple>(null);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [aceptaAvisos, setAceptaAvisos] = useState(false);
  const [permisoAvisos, setPermisoAvisos] = useState<"pidiendo" | "activo" | "bloqueado" | null>(
    null,
  );
  // Se pide el permiso al marcar la casilla (toque del usuario) y se guarda al crear la tarjeta.
  const suscripcion = useRef<PushSubscription | null>(null);

  async function cambiarAvisos(marcada: boolean) {
    setAceptaAvisos(marcada);
    if (!marcada || suscripcion.current) return;
    setPermisoAvisos("pidiendo");
    try {
      const sub = await pedirSuscripcion();
      if (sub === "denegado") return setPermisoAvisos("bloqueado");
      suscripcion.current = sub;
      setPermisoAvisos(sub ? "activo" : null);
    } catch (e) {
      console.error("No se pudieron pedir los avisos:", e);
      setPermisoAvisos(null);
    }
  }
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (nombre.trim().length < 3) {
      setError("Escribe tu nombre y apellido.");
      return;
    }
    if (instagram.trim().replace(/^@/, "").length < 2) {
      setError("Déjanos tu usuario de Instagram.");
      return;
    }

    if (!aceptaTerminos) {
      setError("Para crear tu tarjeta debes aceptar los términos y la política de privacidad.");
      return;
    }

    if (cumpleanos === false) {
      setError("Revisa tu cumpleaños: escribe día, mes y año (ej: 07 / 03 / 1995).");
      return;
    }

    setEnviando(true);
    const { data, error: err } = await supabase.rpc("registro_publico", {
      p_nombre: nombre.trim(),
      p_instagram: instagram.trim().replace(/^@/, ""),
      p_cumpleanos: cumpleanos,
    });
    setEnviando(false);

    if (err || !data) {
      setError("No pudimos crear tu tarjeta. Inténtalo de nuevo.");
      return;
    }
    // Respaldo del consentimiento: si falla, no bloquea el registro.
    supabase
      .rpc("registrar_consentimiento", { p_enlace: data, p_acepta_avisos: aceptaAvisos })
      .then(({ error: e }) => e && console.error("No se guardó el consentimiento:", e));
    if (aceptaAvisos) localStorage.setItem("avisos_aceptados", "1");
    if (aceptaAvisos && suscripcion.current) {
      await guardarSuscripcion(data, suscripcion.current).catch((e) =>
        console.error("No se guardó la suscripción de avisos:", e),
      );
    }
    localStorage.setItem("tarjeta_enlace", data as string);
    sessionStorage.setItem("recien_registrado", "1");
    navigate({ to: "/t/$enlace", params: { enlace: data as string } });
  }

  const campo =
    "mt-1 w-full rounded-xl border border-primary/30 bg-crema px-3 py-2.5 text-base text-primary outline-none transition-colors focus:border-primary";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <form
        onSubmit={enviar}
        className="w-full max-w-sm rounded-3xl border border-primary/30 bg-card p-6 shadow-card"
      >
        <img
          src="/logo.png"
          alt={`Logo ${MARCA}`}
          className="mx-auto h-20 w-20 rounded-full ring-4 ring-arena"
        />
        <h1 className="mt-3 text-center text-xl font-bold leading-tight text-primary">
          Únete a {MARCA}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Tu tarjeta de {META} sellos
        </p>

        <label className="mt-5 block text-sm font-semibold text-primary" htmlFor="nombre">
          Nombre y apellido
        </label>
        <input
          id="nombre"
          required
          maxLength={80}
          autoComplete="name"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Ana Pérez"
          className={campo}
        />

        <label className="mt-4 block text-sm font-semibold text-primary" htmlFor="instagram">
          Usuario de Instagram
        </label>
        <input
          id="instagram"
          required
          maxLength={50}
          autoCapitalize="none"
          autoCorrect="off"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
          placeholder="@tuusuario"
          className={campo}
        />

        <p className="mt-4 block text-sm font-semibold text-primary">
          🎂 Cumpleaños{" "}
          <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
        </p>
        <CampoCumpleanos onChange={setCumpleanos} className="mt-1" />
        <p className="mt-1 text-xs text-muted-foreground">Así te saludamos en tu día. 🎉</p>

        <Terminos className="mt-5" />

        <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-snug text-primary">
          <input
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary"
          />
          <span>
            Leí y acepto los términos y condiciones y la{" "}
            <a
              href="/privacidad"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              política de privacidad
            </a>
            .
          </span>
        </label>

        <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm leading-snug text-primary">
          <input
            type="checkbox"
            checked={aceptaAvisos}
            onChange={(e) => cambiarAvisos(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-primary"
          />
          <span>
            Quiero recibir avisos de promociones en mi celular.{" "}
            <span className="text-muted-foreground">
              (Opcional. Puedes desactivarlos cuando quieras.)
            </span>
            {aceptaAvisos && permisoAvisos && (
              <span className="mt-1 block text-xs font-semibold" role="status">
                {permisoAvisos === "pidiendo" && "Toca «Permitir» en el aviso de tu celular."}
                {permisoAvisos === "activo" && "🔔 ¡Listo! Te avisaremos de las promos."}
                {permisoAvisos === "bloqueado" &&
                  "Bloqueaste los avisos. Puedes activarlos después en los permisos del navegador."}
              </span>
            )}
          </span>
        </label>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={enviando || !aceptaTerminos || !nombre.trim() || !instagram.trim()}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-[transform,opacity] hover:opacity-90 active:scale-[0.97] disabled:opacity-60"
        >
          {enviando ? "Creando tarjeta…" : "Crear mi tarjeta"}
        </button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          ¿Ya tienes tarjeta?{" "}
          <Link to="/mi-tarjeta" className="font-semibold text-primary underline">
            Búscala aquí
          </Link>
        </p>
      </form>
    </main>
  );
}
