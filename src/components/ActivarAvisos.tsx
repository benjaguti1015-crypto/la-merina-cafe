import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CLAVE_PUBLICA = import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string | undefined;

function base64AUint8(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

type Estado = "oculto" | "listo" | "activo" | "bloqueado" | "guardando" | "error" | "ios";

export function ActivarAvisos({
  enlace,
  ios,
  instalada,
}: {
  enlace: string;
  ios: boolean;
  instalada: boolean;
}) {
  const [estado, setEstado] = useState<Estado>("oculto");

  useEffect(() => {
    if (!CLAVE_PUBLICA) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      // iPhone solo permite avisos con la tarjeta guardada en el inicio.
      setEstado(ios && !instalada ? "ios" : "oculto");
      return;
    }
    if (Notification.permission === "denied") return setEstado("bloqueado");
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEstado(sub ? "activo" : "listo"))
      .catch(() => setEstado("oculto"));
  }, [ios, instalada]);

  async function activar() {
    if (!CLAVE_PUBLICA) return;
    setEstado("guardando");
    try {
      if ((await Notification.requestPermission()) !== "granted") {
        setEstado(Notification.permission === "denied" ? "bloqueado" : "listo");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64AUint8(CLAVE_PUBLICA),
      });
      const { endpoint, keys } = sub.toJSON();
      const { data, error } = await supabase.rpc("guardar_suscripcion_push", {
        p_enlace: enlace,
        p_endpoint: endpoint ?? "",
        p_p256dh: keys?.p256dh ?? "",
        p_auth: keys?.auth ?? "",
      });
      if (error || !data) {
        await sub.unsubscribe();
        setEstado("error");
        return;
      }
      setEstado("activo");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "oculto") return null;
  if (estado === "activo")
    return <p className="text-xs text-muted-foreground">🔔 Avisos activados</p>;
  if (estado === "bloqueado")
    return (
      <p className="text-center text-xs text-muted-foreground">
        Bloqueaste los avisos. Puedes activarlos en los permisos del navegador.
      </p>
    );
  if (estado === "ios")
    return (
      <p className="text-center text-xs text-muted-foreground">
        🔔 En iPhone, guarda la tarjeta en tu inicio para activar avisos.
      </p>
    );

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={activar}
        disabled={estado === "guardando"}
        className="text-sm font-semibold text-primary underline transition-transform active:scale-[0.97] disabled:opacity-60"
      >
        {estado === "guardando" ? "Activando…" : "🔔 Activar avisos de promos"}
      </button>
      {estado === "error" && (
        <p className="mt-1 text-xs text-destructive">No pudimos activarlos. Inténtalo de nuevo.</p>
      )}
    </div>
  );
}
