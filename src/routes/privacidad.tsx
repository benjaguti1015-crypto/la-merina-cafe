import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { INSTAGRAM, LINK_INSTAGRAM, MARCA_COMPLETA } from "@/lib/marca";

const CORREO = "lamerinacafe@gmail.com";

export const Route = createFileRoute("/privacidad")({
  head: () => ({
    meta: [
      { title: `Política de privacidad | ${MARCA_COMPLETA}` },
      {
        name: "description",
        content: `Qué datos guarda la tarjeta de fidelidad de ${MARCA_COMPLETA}, para qué y cómo puedes controlarlos.`,
      },
    ],
  }),
  component: Privacidad,
});

function Seccion({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg leading-tight text-primary">
        {n}. {titulo}
      </h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}

function Lista({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Privacidad() {
  const enlaceCorreo = (
    <a href={`mailto:${CORREO}`} className="font-semibold text-primary underline">
      {CORREO}
    </a>
  );

  return (
    <main className="flex min-h-screen justify-center bg-background px-4 py-8">
      <article className="w-full max-w-xl rounded-3xl bg-card p-6 shadow-card sm:p-10">
        <h1 className="text-3xl leading-tight text-primary">Política de privacidad</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Última actualización: 14 de octubre de 2026
        </p>

        <p className="mt-5 text-sm leading-relaxed text-foreground/85">
          En {MARCA_COMPLETA} cuidamos tus datos. Aquí te contamos qué guardamos, para qué y cómo
          puedes controlarlos. Esta política se rige por la Ley N° 19.628 sobre protección de la
          vida privada y por la Ley N° 21.719, en lo que resulte aplicable.
        </p>

        <Seccion n={1} titulo="Quién es responsable">
          <p>
            Andrea Campos, titular de {MARCA_COMPLETA}, cafetería de especialidad, librería y
            galería en Tomé, Chile. Puedes escribirnos a {enlaceCorreo} o por mensaje directo en
            Instagram:{" "}
            <a
              href={LINK_INSTAGRAM}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline"
            >
              @{INSTAGRAM}
            </a>
            .
          </p>
        </Seccion>

        <Seccion n={2} titulo="Qué datos guardamos">
          <Lista
            items={[
              "Tu nombre y apellido.",
              "Tu usuario de Instagram.",
              "Tu fecha de cumpleaños, solo si decides darla.",
              "Tus sellos y premios, y un enlace único de tu tarjeta.",
              "La fecha en que aceptaste estos términos y si aceptaste recibir avisos, como respaldo de tu consentimiento.",
              "Si activas los avisos, un identificador técnico de tu dispositivo, necesario para enviarte notificaciones.",
            ]}
          />
          <p>
            No pedimos RUT, dirección, datos de pago ni contraseñas. Para recordar tu tarjeta en tu
            celular guardamos el enlace en el almacenamiento de tu navegador; no usamos cookies de
            publicidad.
          </p>
        </Seccion>

        <Seccion n={3} titulo="Para qué los usamos">
          <Lista
            items={[
              "Crear tu tarjeta, sumar tus sellos y entregarte tus premios.",
              "Verificar tu cuenta de Instagram para validar los sellos.",
              "Saludarte en tu cumpleaños, si nos diste la fecha.",
              "Enviarte avisos de promociones, solo si lo aceptaste.",
            ]}
          />
          <p>No vendemos tus datos ni los usamos para otros fines.</p>
        </Seccion>

        <Seccion n={4} titulo="Tu consentimiento">
          <p>
            Tratamos tus datos porque nos das tu consentimiento al registrarte. Aceptar los términos
            y esta política es necesario para tener tu tarjeta. Recibir notificaciones es opcional,
            y puedes cambiar de opinión cuando quieras.
          </p>
          <p>
            Si eres menor de 14 años, necesitas la autorización de tu madre, padre o tutor para
            registrarte.
          </p>
        </Seccion>

        <Seccion n={5} titulo="Con quién los compartimos">
          <p>Solo con los servicios que hacen funcionar la tarjeta:</p>
          <Lista
            items={[
              "Supabase, donde se guarda la base de datos.",
              "Vercel, donde está alojada la página.",
              "Los servicios de notificaciones de tu navegador (Google, Apple o Mozilla, según tu dispositivo), si activas los avisos.",
            ]}
          />
          <p>
            Algunos de estos servicios pueden almacenar datos fuera de Chile. Los elegimos por sus
            medidas de seguridad.
          </p>
        </Seccion>

        <Seccion n={6} titulo="Cuánto tiempo los guardamos">
          <p>
            Mientras tu tarjeta esté activa. Si pides que la eliminemos, borramos tus datos y tus
            avisos.
          </p>
        </Seccion>

        <Seccion n={7} titulo="Tus derechos">
          <p>
            Puedes pedirnos en cualquier momento: acceder a tus datos, corregirlos, eliminarlos u
            oponerte a que los usemos. También puedes retirar tu consentimiento y pedir que dejemos
            de enviarte notificaciones.
          </p>
          <p>
            Escríbenos por correo o Instagram y respondemos tu solicitud en un plazo máximo de 30
            días. Para dejar de recibir avisos también puedes desactivarlos en los permisos de tu
            navegador.
          </p>
          <p>
            Si crees que no respetamos tus derechos, puedes reclamar ante la autoridad de protección
            de datos personales que corresponda.
          </p>
        </Seccion>

        <Seccion n={8} titulo="Seguridad">
          <p>
            Usamos conexiones cifradas y acceso restringido a la base de datos. Ningún sistema es
            100% seguro; si ocurre un incidente que te afecte, te avisaremos.
          </p>
        </Seccion>

        <Seccion n={9} titulo="Cambios en esta política">
          <p>
            Si la actualizamos, cambiaremos la fecha de arriba. Si el cambio es importante, te lo
            avisaremos.
          </p>
        </Seccion>

        <Link
          to="/registro"
          className="mt-8 inline-block text-sm font-semibold text-primary underline"
        >
          ← Volver al registro
        </Link>
      </article>
    </main>
  );
}
