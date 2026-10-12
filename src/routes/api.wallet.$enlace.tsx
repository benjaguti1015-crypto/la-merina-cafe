import { createFileRoute } from "@tanstack/react-router";

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "content-type": "application/json" },
  });

// Devuelve el enlace "Añadir a Google Wallet" de una tarjeta.
export const Route = createFileRoute("/api/wallet/$enlace")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        if (!/^[\w-]{1,64}$/.test(params.enlace)) return json({ error: "No encontrada." }, 404);
        const { configWallet, leerTarjeta, urlGuardarEnWallet } =
          await import("@/lib/wallet.server");
        const cfg = configWallet();
        if (!cfg) return json({ error: "Wallet no está configurado." }, 503);

        try {
          const tarjeta = await leerTarjeta(params.enlace);
          if (!tarjeta) return json({ error: "No encontrada." }, 404);
          const url = await urlGuardarEnWallet(
            cfg,
            params.enlace,
            tarjeta,
            new URL(request.url).origin,
          );
          return json({ url });
        } catch (e) {
          console.error(e);
          return json({ error: "No pudimos crear el pase." }, 500);
        }
      },
    },
  },
});
