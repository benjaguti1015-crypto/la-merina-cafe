import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TarjetaFidelidad } from "@/components/TarjetaFidelidad";
import { Terminos } from "@/components/Terminos";
import { ActivarAvisos } from "@/components/ActivarAvisos";
import { BotonWallet } from "@/components/BotonWallet";
import { MARCA } from "@/lib/marca";

export const Route = createFileRoute("/t/$enlace")({
  head: ({ params }) => ({
    meta: [
      { name: "theme-color", content: "#f5f1e8" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: MARCA },
    ],
    links: [
      { rel: "manifest", href: `/api/manifest/${params.enlace}` },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  component: VistaCliente,
});

type PromptInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

type Tarjeta = {
  nombre_completo: string;
  sellos_actuales: number;
  instagram: string | null;
  cumpleanos?: string | null;
  enlace_unico?: string;
};

// Acepta dd/mm/aaaa (formato del registro) y aaaa-mm-dd.
function esHoyCumpleanos(fecha?: string | null) {
  const m =
    fecha?.match(/^(\d{1,2})\/(\d{1,2})\/\d{4}$/) ?? fecha?.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m || !fecha) return false;
  const [dia, mes] = fecha.includes("/") ? [+m[1]!, +m[2]!] : [+m[2]!, +m[1]!];
  const hoy = new Date();
  return dia === hoy.getDate() && mes === hoy.getMonth() + 1;
}

function VistaCliente() {
  const { enlace } = Route.useParams();
  const [deferredPrompt, setDeferredPrompt] = useState<PromptInstalar | null>(null);
  const [mostrarAyudaInstalacion, setMostrarAyudaInstalacion] = useState(false);
  const [instalada, setInstalada] = useState(false);
  const [recien, setRecien] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [entorno, setEntorno] = useState({ ios: false, enApp: false });

  // Estados para el Modal de Cumpleaños
  const [mostrarModalCumple, setMostrarModalCumple] = useState(false);
  const [fechaCumple, setFechaCumple] = useState("");
  const [guardandoCumple, setGuardandoCumple] = useState(false);
  const [errorCumple, setErrorCumple] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("tarjeta_enlace", enlace);

    const ua = navigator.userAgent;
    setEntorno({ ios: /iPhone|iPad|iPod/i.test(ua), enApp: /Instagram|FBAN|FBAV/i.test(ua) });
    setInstalada(
      window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as { standalone?: boolean }).standalone === true,
    );
    setRecien(sessionStorage.getItem("recien_registrado") === "1");

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PromptInstalar);
    };
    const handleInstalada = () => setInstalada(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalada);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalada);
    };
  }, [enlace]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tarjeta", enlace],
    queryFn: async (): Promise<Tarjeta | null> => {
      const { data, error } = await supabase.rpc("tarjeta_publica", { p_enlace: enlace });
      if (error) throw error;
      return (data as Tarjeta[])?.[0] ?? null;
    },
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Evaluar si falta el cumpleaños al cargar la tarjeta
  useEffect(() => {
    if (data && !data.cumpleanos) {
      setMostrarModalCumple(true);
    } else if (data && data.cumpleanos) {
      setMostrarModalCumple(false);
    }
  }, [data?.cumpleanos]);

  // Guardar cumpleaños en Supabase con RPC segura
  const handleGuardarCumpleanos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaCumple) return;

    setGuardandoCumple(true);
    setErrorCumple(null);

    // yyyy-mm-dd -> dd/mm/yyyy, mismo formato que usa /registro
    const cumpleanosFormato = fechaCumple.split("-").reverse().join("/");

    const { data: guardado, error } = await supabase.rpc("actualizar_cumpleanos_publico", {
      p_enlace: enlace,
      p_cumpleanos: cumpleanosFormato,
    });

    setGuardandoCumple(false);

    if (error || !guardado) {
      setErrorCumple("No pudimos guardar tu fecha. Inténtalo de nuevo.");
      return;
    }

    setMostrarModalCumple(false);
    setFechaCumple("");
    await refetch();
  };

  const cerrarRecien = () => {
    sessionStorage.removeItem("recien_registrado");
    setRecien(false);
  };

  const copiarEnlace = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleClickGuardar = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        cerrarRecien();
      }
    } else {
      setMostrarAyudaInstalacion(true);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 relative">
      {isLoading ? (
        <p className="text-muted-foreground animate-pulse font-medium">
          Cargando tu tarjeta…
        </p>
      ) : isError || !data ? (
        <p className="max-w-xs text-center text-muted-foreground">
          No encontramos esta tarjeta. Pídenos en caja un enlace válido.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-sm">
          {recien && !instalada && (
            <div className="w-full rounded-2xl border border-arena bg-arena-suave px-4 py-3 text-center animate-fade-in">
              <p className="text-sm font-semibold text-primary">
                ¡Tu tarjeta está lista! Guárdala para tener tus sellos a un toque.
              </p>
              <button
                type="button"
                onClick={handleClickGuardar}
                className="mt-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
              >
                Guardar en mi celular
              </button>
              <button
                type="button"
                onClick={cerrarRecien}
                className="mt-2 text-xs text-muted-foreground underline"
              >
                Ahora no
              </button>
            </div>
          )}

          {esHoyCumpleanos(data.cumpleanos) && (
            <p className="w-full rounded-2xl border border-arena bg-arena-suave px-4 py-3 text-center text-sm font-semibold text-primary animate-fade-in">
              🎂 ¡Feliz cumpleaños, {data.nombre_completo.split(" ")[0]}! Muéstranos tu tarjeta en
              caja: tenemos una sorpresa para ti.
            </p>
          )}

          <TarjetaFidelidad
            nombre={data.nombre_completo}
            sellos={data.sellos_actuales}
            instagram={data.instagram}
          />

          {!instalada && !recien && (
            <button
              type="button"
              onClick={handleClickGuardar}
              className="text-sm font-semibold text-primary underline transition-transform active:scale-[0.97]"
            >
              📲 Guardar mi tarjeta en el celular
            </button>
          )}

          <ActivarAvisos enlace={enlace} ios={entorno.ios} instalada={instalada} />
          <BotonWallet enlace={enlace} />

          <Terminos className="w-full max-w-sm" />
        </div>
      )}

      {/* MODAL CUMPLEAÑOS (Para clientes existentes) */}
      {mostrarModalCumple && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl border border-primary/15 bg-card p-6 shadow-2xl text-primary">
            <div className="text-center">
              <span className="text-4xl">🎂</span>
              <h3 className="mt-2 text-lg font-bold">Sorpresa de cumpleaños</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Ingresa tu fecha de cumpleaños para regalarte una sorpresa especial en tu mes. 🎈
              </p>
            </div>

            <form onSubmit={handleGuardarCumpleanos} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-primary block mb-1">
                  Tu fecha de nacimiento:
                </label>
                <input
                  type="date"
                  value={fechaCumple}
                  onChange={(e) => setFechaCumple(e.target.value)}
                  required
                  className="w-full rounded-xl border-2 border-primary/40 bg-crema px-3 py-2 text-sm text-primary outline-none focus:border-primary"
                />
              </div>

              {errorCumple && <p className="text-xs text-destructive text-center">{errorCumple}</p>}

              <button
                type="submit"
                disabled={guardandoCumple}
                className="w-full rounded-xl bg-primary px-4 py-2.5 font-bold text-primary-foreground shadow transition-opacity hover:opacity-90 text-sm disabled:opacity-60"
              >
                {guardandoCumple ? "Guardando..." : "Guardar mi fecha ☕"}
              </button>
              <button
                type="button"
                onClick={() => setMostrarModalCumple(false)}
                className="w-full text-center text-xs text-muted-foreground underline"
              >
                Ahora no
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GUÍA PARA GUARDAR */}
      {mostrarAyudaInstalacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xs rounded-3xl border border-primary/30 bg-card p-6 text-primary shadow-2xl">
            <h3 className="text-center text-lg font-bold">
              {entorno.enApp ? "Ábrela en tu navegador" : "Guarda tu tarjeta"}
            </h3>
            {entorno.enApp ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  Desde Instagram no se puede guardar. Toca ⋯ arriba y elige «Abrir en el
                  navegador», o copia tu enlace y pégalo en Chrome o Safari.
                </p>
                <button
                  type="button"
                  onClick={copiarEnlace}
                  className="mt-4 w-full rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-semibold transition-transform active:scale-[0.97]"
                >
                  {copiado ? "¡Copiado!" : "Copiar mi enlace"}
                </button>
              </>
            ) : (
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
                {entorno.ios ? (
                  <>
                    <li>En Safari, toca Compartir (⎋).</li>
                    <li>Elige «Agregar al inicio».</li>
                    <li>Toca «Agregar». ¡Listo!</li>
                  </>
                ) : (
                  <>
                    <li>Toca los tres puntos (⋮) arriba.</li>
                    <li>Elige «Instalar app» o «Agregar a pantalla principal».</li>
                    <li>Confirma. ¡Listo!</li>
                  </>
                )}
              </ol>
            )}
            <button
              type="button"
              onClick={() => setMostrarAyudaInstalacion(false)}
              className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.97]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
