// La ovejita del logo de La Merina. Blanca para el sello marcado;
// `contorno` la dibuja en línea azul para las casillas vacías.
export function Oveja({
  className = "",
  contorno = false,
}: {
  className?: string;
  contorno?: boolean;
}) {
  const lana = contorno ? "none" : "#ffffff";
  const linea = contorno ? "var(--petroleo)" : "#ffffff";
  return (
    <svg viewBox="0 0 32 28" className={className} aria-hidden>
      <g stroke={linea} strokeWidth="1.8" strokeLinecap="round">
        <path d="M10 19.5v5M14 20.5v5M19 20.5v5M23 19.5v5" />
      </g>
      <path
        d="M8.5 16.5a4 4 0 0 1 1.2-7.3 4.6 4.6 0 0 1 7.6-2.4 4.4 4.4 0 0 1 7 2.6 3.9 3.9 0 0 1-.3 7.6 4.2 4.2 0 0 1-6.6 2.4 4.4 4.4 0 0 1-6.4.3 3.8 3.8 0 0 1-2.5-3.2Z"
        fill={lana}
        stroke={linea}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <ellipse
        cx="26.6"
        cy="11.6"
        rx="3"
        ry="3.9"
        transform="rotate(18 26.6 11.6)"
        fill={contorno ? "none" : "var(--arena)"}
        stroke={linea}
        strokeWidth="1.4"
      />
      <path
        d="M24.4 8.6c-1.4-.6-2.4-.2-2.8.6"
        stroke={linea}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="27.4" cy="11" r="0.8" fill="var(--petroleo)" />
    </svg>
  );
}
