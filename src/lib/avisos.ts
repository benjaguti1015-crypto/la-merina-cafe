import { supabase } from "@/integrations/supabase/client";

const CLAVE_PUBLICA = import.meta.env["VITE_VAPID_PUBLIC_KEY"] as string | undefined;

function base64AUint8(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

// iPhone solo los permite con la tarjeta guardada en el inicio; ahí esto da false.
export function avisosDisponibles() {
  return Boolean(CLAVE_PUBLICA) && "serviceWorker" in navigator && "PushManager" in window;
}

// Debe llamarse dentro de un toque del usuario: el navegador solo muestra el permiso así.
export async function pedirSuscripcion(): Promise<PushSubscription | "denegado" | null> {
  if (!CLAVE_PUBLICA || !avisosDisponibles()) return null;
  if ((await Notification.requestPermission()) !== "granted") return "denegado";
  await navigator.serviceWorker.register("/sw.js");
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64AUint8(CLAVE_PUBLICA),
  });
}

// Si no se pudo guardar, se anula la suscripción para que la tarjeta ofrezca activarla de nuevo.
export async function guardarSuscripcion(enlace: string, sub: PushSubscription) {
  const { endpoint, keys } = sub.toJSON();
  const { data, error } = await supabase.rpc("guardar_suscripcion_push", {
    p_enlace: enlace,
    p_endpoint: endpoint ?? "",
    p_p256dh: keys?.["p256dh"] ?? "",
    p_auth: keys?.["auth"] ?? "",
  });
  if (error || !data) {
    await sub.unsubscribe();
    return false;
  }
  return true;
}
