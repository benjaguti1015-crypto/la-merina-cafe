import { useRef, useState } from "react";

// null = vacío, false = incompleto o fecha imposible, string = "dd/mm/aaaa".
export type Cumple = string | null | false;

export function leerCumple(dia: string, mes: string, anio: string): Cumple {
  if (!dia && !mes && !anio) return null;
  const [d, m, a] = [Number(dia), Number(mes), Number(anio)];
  const fecha = new Date(a, m - 1, d);
  const valida =
    anio.length === 4 &&
    a >= 1900 &&
    a <= new Date().getFullYear() &&
    fecha.getDate() === d &&
    fecha.getMonth() === m - 1;
  return valida ? `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${a}` : false;
}

// Tres casillas numéricas en vez del calendario: más rápido de llenar en el celular.
export function CampoCumpleanos({
  onChange,
  className = "",
}: {
  onChange: (valor: Cumple) => void;
  className?: string;
}) {
  const [partes, setPartes] = useState({ dia: "", mes: "", anio: "" });
  const mesRef = useRef<HTMLInputElement>(null);
  const anioRef = useRef<HTMLInputElement>(null);

  function cambiar(
    campo: keyof typeof partes,
    valor: string,
    largo: number,
    siguiente?: HTMLInputElement | null,
  ) {
    const limpio = valor.replace(/\D/g, "").slice(0, largo);
    const nuevas = { ...partes, [campo]: limpio };
    setPartes(nuevas);
    onChange(leerCumple(nuevas.dia, nuevas.mes, nuevas.anio));
    if (limpio.length === largo) siguiente?.focus();
  }

  const caja =
    "w-full rounded-xl border border-primary/30 bg-crema px-2 py-2.5 text-center text-base text-primary outline-none transition-colors placeholder:text-primary/30 focus:border-primary";

  return (
    <div className={`grid grid-cols-[1fr_1fr_1.5fr] gap-2 ${className}`}>
      <input
        aria-label="Día de tu cumpleaños"
        inputMode="numeric"
        autoComplete="bday-day"
        placeholder="DD"
        value={partes.dia}
        onChange={(e) => cambiar("dia", e.target.value, 2, mesRef.current)}
        className={caja}
      />
      <input
        ref={mesRef}
        aria-label="Mes de tu cumpleaños"
        inputMode="numeric"
        autoComplete="bday-month"
        placeholder="MM"
        value={partes.mes}
        onChange={(e) => cambiar("mes", e.target.value, 2, anioRef.current)}
        className={caja}
      />
      <input
        ref={anioRef}
        aria-label="Año de tu cumpleaños"
        inputMode="numeric"
        autoComplete="bday-year"
        placeholder="AAAA"
        value={partes.anio}
        onChange={(e) => cambiar("anio", e.target.value, 4)}
        className={caja}
      />
    </div>
  );
}
