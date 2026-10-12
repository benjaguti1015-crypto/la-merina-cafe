import { createFileRoute } from "@tanstack/react-router";
import { MARCA, MARCA_COMPLETA, META } from "@/lib/marca";

// Un manifest por tarjeta: así el ícono instalado abre directo la tarjeta de cada cliente.
export const Route = createFileRoute("/api/manifest/$enlace")({
  server: {
    handlers: {
      GET: ({ params }) => {
        if (!/^[\w-]{1,64}$/.test(params.enlace)) return new Response("Not found", { status: 404 });

        const manifest = {
          name: MARCA_COMPLETA,
          short_name: MARCA,
          description: `Tu tarjeta de fidelidad: junta ${META} sellos y reclama tu premio.`,
          lang: "es",
          id: `/t/${params.enlace}`,
          start_url: `/t/${params.enlace}`,
          scope: "/t/",
          display: "standalone",
          background_color: "#f5f1e8",
          theme_color: "#f5f1e8",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          ],
        };

        return new Response(JSON.stringify(manifest), {
          headers: { "content-type": "application/manifest+json" },
        });
      },
    },
  },
});
