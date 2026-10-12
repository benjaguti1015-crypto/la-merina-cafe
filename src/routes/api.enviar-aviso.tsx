import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json" },
  });

// Solo el admin con sesión iniciada puede enviar: se valida el token con Supabase.
export const Route = createFileRoute("/api/enviar-aviso")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
        if (!token) return json({ error: "Inicia sesión." }, 401);

        const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const clave =
          process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const vapidPublica = process.env.VITE_VAPID_PUBLIC_KEY;
        const vapidPrivada = process.env.VAPID_PRIVATE_KEY;
        if (!url || !clave || !vapidPublica || !vapidPrivada) {
          return json({ error: "Faltan variables de entorno de avisos." }, 500);
        }

        const supabase = createClient(url, clave, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false },
        });
        const { data: usuario } = await supabase.auth.getUser(token);
        if (!usuario.user) return json({ error: "Sesión no válida." }, 401);

        const cuerpo = (await request.json().catch(() => null)) as {
          titulo?: unknown;
          texto?: unknown;
        } | null;
        const titulo = typeof cuerpo?.titulo === "string" ? cuerpo.titulo.trim() : "";
        const texto = typeof cuerpo?.texto === "string" ? cuerpo.texto.trim() : "";
        if (!titulo || !texto || titulo.length > 60 || texto.length > 200) {
          return json({ error: "Título (máx. 60) y texto (máx. 200) son obligatorios." }, 400);
        }

        const { data: suscripciones, error } = await supabase
          .from("suscripciones_push")
          .select("id, endpoint, p256dh, auth, clientes(enlace_unico)");
        if (error) return json({ error: "No pudimos leer las suscripciones." }, 500);

        const webpush = (await import("web-push")).default;
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT ?? "mailto:admin@example.com",
          vapidPublica,
          vapidPrivada,
        );

        const caducadas: string[] = [];
        let enviados = 0;
        await Promise.all(
          (suscripciones ?? []).map(async (s) => {
            const cliente = Array.isArray(s.clientes) ? s.clientes[0] : s.clientes;
            try {
              await webpush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                JSON.stringify({
                  titulo,
                  texto,
                  url: cliente ? `/t/${cliente.enlace_unico}` : "/",
                }),
              );
              enviados++;
            } catch (e) {
              const codigo = (e as { statusCode?: number }).statusCode;
              if (codigo === 404 || codigo === 410) caducadas.push(s.id);
            }
          }),
        );

        // Dispositivos que ya no existen: se limpian solos.
        if (caducadas.length)
          await supabase.from("suscripciones_push").delete().in("id", caducadas);

        return json({ enviados, total: suscripciones?.length ?? 0, eliminadas: caducadas.length });
      },
    },
  },
});
