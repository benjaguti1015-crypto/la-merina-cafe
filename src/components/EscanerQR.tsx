import { useEffect, useRef, useState } from "react";

const ELEMENT_ID = "lector-qr-merina";

export function EscanerQR({
  onLeer,
  onCerrar,
}: {
  onLeer: (texto: string) => void;
  onCerrar: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const leidoRef = useRef(false);
  const onLeerRef = useRef(onLeer);
  onLeerRef.current = onLeer;

  useEffect(() => {
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null;
    let activo = true;

    import("html5-qrcode")
      .then(async ({ Html5Qrcode }) => {
        if (!activo) return;
        const instancia = new Html5Qrcode(ELEMENT_ID);
        scanner = instancia as unknown as typeof scanner;
        await instancia.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (texto) => {
            if (leidoRef.current) return;
            leidoRef.current = true;
            onLeerRef.current(texto);
          },
          () => {},
        );
      })
      .catch(() =>
        setError("No pudimos abrir la cámara. Revisa los permisos del navegador."),
      );

    return () => {
      activo = false;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner?.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/70 px-4">
      <div className="w-full max-w-xs rounded-3xl border-2 border-primary/70 bg-card p-5 shadow-card">
        <p className="text-center text-lg font-semibold text-primary">Escanear QR</p>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Apunta al código QR de la tarjeta del cliente.
        </p>

        <div
          id={ELEMENT_ID}
          className="mt-4 overflow-hidden rounded-2xl border-2 border-primary/40 bg-crema"
        />

        {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

        <button
          onClick={onCerrar}
          className="mt-4 w-full rounded-xl border-2 border-primary/50 px-4 py-2.5 font-semibold text-primary"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
