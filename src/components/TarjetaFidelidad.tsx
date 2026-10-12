import { useEffect, useRef, useState } from "react";
import { CodigoQR, codigoQrDeInstagram } from "@/components/CodigoQR";
import { Oveja } from "@/components/Oveja";
import { INSTAGRAM, LINK_INSTAGRAM, MARCA, META, PREMIOS } from "@/lib/marca";

// Inclinación fija de cada sello, como un timbre de goma puesto a mano.
const GIROS = [-8, 5, -3, 7, -6, 4, -2, 6, -5, 0];

function Roseta({ centro = "var(--petroleo)", className = "" }: { centro?: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 48" className={className} aria-hidden>
      <path d="M13 26 7 46l7-4 4 6 3-20Z" fill="var(--arena)" />
      <path d="M27 26l6 20-7-4-4 6-3-20Z" fill="#bfae8a" />
      <circle cx="20" cy="17" r="15" fill="var(--arena)" />
      <circle cx="20" cy="17" r="10.5" fill={centro} />
    </svg>
  );
}

function IconoInstagram() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function BotonSeguirnos({ className = "" }: { className?: string }) {
  return (
    <a
      href={LINK_INSTAGRAM}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition-transform duration-150 active:scale-[0.97] ${className}`}
    >
      <IconoInstagram />
      Síguenos en Instagram
    </a>
  );
}

export function TarjetaFidelidad({
  nombre,
  sellos,
  instagram,
}: {
  nombre: string;
  sellos: number;
  instagram?: string | null;
}) {
  const activos = Math.max(0, Math.min(META, sellos));

  // Solo se anima el sello recién puesto, no los que ya estaban al abrir.
  const anterior = useRef(activos);
  const [desde, setDesde] = useState(activos);
  useEffect(() => {
    if (activos > anterior.current) setDesde(anterior.current);
    anterior.current = activos;
  }, [activos]);

  const proximoPremio = Object.keys(PREMIOS)
    .map(Number)
    .find((n) => n > activos);

  return (
    <div className="w-full max-w-sm space-y-3">
      <article className="overflow-hidden rounded-3xl bg-white shadow-card">
        <header className="granos flex items-center gap-3 px-4 py-3">
          <img
            src="/logo.png"
            alt={`Logo ${MARCA} Tomé`}
            className="h-16 w-16 shrink-0 rounded-full bg-white ring-[3px] ring-arena"
          />
          <div className="min-w-0 rounded-xl bg-white/80 px-1.5 py-0.5">
            <p className="font-marca text-[22px] leading-none text-primary">{MARCA}</p>
            <p className="mt-1 font-marca text-[10.5px] leading-tight text-primary">
              Cafetería de Especialidad · Librería · Galería
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">
              Fábrica Bellavista Oveja Tomé
            </p>
          </div>
        </header>

        <section className="granos-arena px-4 pb-3 pt-4">
          <div className="grid grid-cols-5 gap-2.5">
            {Array.from({ length: META }, (_, i) => {
              const numero = i + 1;
              const activo = i < activos;
              const premio = PREMIOS[numero];
              return (
                <div
                  key={i}
                  aria-label={`Sello ${numero} ${activo ? "marcado" : "pendiente"}${premio ? ` (premio: ${premio})` : ""}`}
                  className="relative flex aspect-square items-center justify-center rounded-full bg-white shadow-[inset_0_2px_5px_rgb(12_58_76/0.12)]"
                >
                  {!activo &&
                    (premio ? (
                      <Roseta className="h-[60%] w-auto" />
                    ) : (
                      <Oveja className="h-[58%] w-[58%] opacity-25" contorno />
                    ))}
                  {activo && (
                    <span
                      style={
                        { "--giro": `${GIROS[i]}deg`, transform: `rotate(${GIROS[i]}deg)` } as React.CSSProperties
                      }
                      className={`absolute inset-[6%] flex items-center justify-center rounded-full bg-petroleo shadow-[0_2px_6px_rgb(1_78_104/0.35)] ${i >= desde ? "sello-nuevo" : ""}`}
                    >
                      <span className="absolute inset-[8%] rounded-full border border-dashed border-white/40" />
                      {premio ? (
                        <Roseta centro="#ffffff" className="h-[58%] w-auto" />
                      ) : (
                        <Oveja className="h-[64%] w-[64%]" />
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-end justify-between gap-3">
            <p className="min-w-0 break-words font-marca text-base leading-tight text-primary">
              {nombre}
            </p>
            <p className="shrink-0 font-marca text-sm text-primary">
              {activos}/{META} sellos
            </p>
          </div>
        </section>
      </article>

      <p className="text-center text-sm font-semibold text-primary">
        {activos === META
          ? "¡Tarjeta completa! Reclama tu premio en caja"
          : proximoPremio
            ? `Sello ${proximoPremio}: ${PREMIOS[proximoPremio]}`
            : `Te faltan ${META - activos} sellos`}
      </p>

      {instagram && (
        <div className="flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card">
          <CodigoQR valor={codigoQrDeInstagram(instagram)} size={96} />
          <div className="min-w-0">
            <p className="font-marca text-base leading-tight text-primary">Muestra este QR en caja</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Así sumamos tu sello. Cuenta: @{instagram.replace(/^@/, "")}
            </p>
          </div>
        </div>
      )}

      <BotonSeguirnos />
      <p className="text-center text-[11px] text-muted-foreground">
        Gracias por ser parte de {MARCA} · @{INSTAGRAM}
      </p>
    </div>
  );
}
