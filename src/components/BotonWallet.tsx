import { useEffect, useState } from "react";

// Google Wallet solo existe en Android.
export function BotonWallet({ enlace }: { enlace: string }) {
  const [android, setAndroid] = useState(false);
  const [estado, setEstado] = useState<"listo" | "cargando" | "error">("listo");

  useEffect(() => setAndroid(/Android/i.test(navigator.userAgent)), []);
  // Oculto hasta que Google apruebe la publicación: activar con VITE_WALLET_VISIBLE=1 en Vercel.
  if (!android || import.meta.env["VITE_WALLET_VISIBLE"] !== "1") return null;

  async function abrir() {
    setEstado("cargando");
    const resp = await fetch(`/api/wallet/${enlace}`).catch(() => null);
    const cuerpo = (await resp?.json().catch(() => null)) as { url?: string } | null;
    if (!cuerpo?.url) return setEstado("error");
    window.location.href = cuerpo.url;
    setEstado("listo");
  }

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={abrir}
        disabled={estado === "cargando"}
        className="rounded-xl border border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary transition-transform active:scale-[0.97] disabled:opacity-60"
      >
        {estado === "cargando" ? "Abriendo…" : "💳 Añadir a Google Wallet"}
      </button>
      {estado === "error" && (
        <p className="mt-1 text-xs text-destructive">
          No pudimos crear el pase. Inténtalo de nuevo.
        </p>
      )}
    </div>
  );
}
