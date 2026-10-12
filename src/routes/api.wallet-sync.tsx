import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json" },
  });

// El admin la llama tras sumar/quitar un sello para que el pase de Wallet se actualice.
export const Route = createFileRoute("/api/wallet-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer /i, "");
        if (!token) return json({ error: "Inicia sesión." }, 401);

        const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const clave =
          process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!url || !clave) return json({ error: "Faltan variables de Supabase." }, 500);
        const { data: usuario } = await createClient(url, clave, {
          auth: { persistSession: false },
        }).auth.getUser(token);
        if (!usuario.user) return json({ error: "Sesión no válida." }, 401);

        const { configWallet, leerTarjeta, actualizarPase } = await import("@/lib/wallet.server");
        const cfg = configWallet();
        if (!cfg) return json({ actualizado: false });

        const cuerpo = (await request.json().catch(() => null)) as { enlace?: unknown } | null;
        const enlace = typeof cuerpo?.enlace === "string" ? cuerpo.enlace : "";
        if (!/^[\w-]{1,64}$/.test(enlace)) return json({ error: "Enlace no válido." }, 400);

        try {
          const tarjeta = await leerTarjeta(enlace);
          if (!tarjeta) return json({ actualizado: false });
          const actualizado = await actualizarPase(cfg, enlace, tarjeta);
          console.log(`wallet-sync: ${tarjeta.sellos_actuales} sellos, actualizado=${actualizado}`);
          return json({ actualizado, sellos: tarjeta.sellos_actuales });
        } catch (e) {
          console.error(e);
          return json({ error: "No se pudo actualizar el pase." }, 500);
        }
      },
    },
  },
});
