import { INSTAGRAM, LINK_INSTAGRAM, META, PREMIOS } from "@/lib/marca";

// PENDIENTE: confirmar con La Merina la compra mínima por sello y los premios.
export function Terminos({ className = "" }: { className?: string }) {
  return (
    <details
      className={`rounded-2xl border border-primary/15 bg-white/70 px-4 py-3 text-left ${className}`}
      aria-label="Términos y condiciones"
    >
      <summary className="cursor-pointer text-center text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
        Términos y condiciones
      </summary>
      <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-muted-foreground">
        <li>Máximo 1 sello por día por cliente.</li>
        <li>Cada compra en La Merina suma 1 sello a tu tarjeta.</li>
        <li>
          Para validar tus sellos y premios debes seguir a{" "}
          <a
            href={LINK_INSTAGRAM}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary underline"
          >
            @{INSTAGRAM}
          </a>{" "}
          en Instagram.
        </li>
        <li>
          Premios al completar tu tarjeta de {META} sellos:{" "}
          {Object.entries(PREMIOS)
            .map(([n, p]) => `sello ${n}, ${p.toLowerCase()}`)
            .join("; ")}
          .
        </li>
        <li>Los premios se canjean en tu próxima visita y están sujetos a disponibilidad.</li>
      </ul>
    </details>
  );
}
