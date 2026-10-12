import { createSign } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { COLOR_MARCA, MARCA_COMPLETA, META, PREFIJO_QR, PREMIOS } from "@/lib/marca";

const API = "https://walletobjects.googleapis.com/walletobjects/v1";
const CLASE = "merina_fidelidad";

export type TarjetaWallet = {
  nombre_completo: string;
  sellos_actuales: number;
  instagram: string | null;
};

export function configWallet() {
  const issuer = process.env.GOOGLE_WALLET_ISSUER_ID;
  const email = process.env.GOOGLE_WALLET_SA_EMAIL;
  // Vercel guarda la clave con \n literales.
  const clave = process.env.GOOGLE_WALLET_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return issuer && email && clave ? { issuer, email, clave } : null;
}
type Config = NonNullable<ReturnType<typeof configWallet>>;

function firmarJwt(payload: object, clave: string) {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const cuerpo = `${b64({ alg: "RS256", typ: "JWT" })}.${b64(payload)}`;
  const firma = createSign("RSA-SHA256").update(cuerpo).sign(clave).toString("base64url");
  return `${cuerpo}.${firma}`;
}

async function tokenApi(cfg: Config) {
  const ahora = Math.floor(Date.now() / 1000);
  const assertion = firmarJwt(
    {
      iss: cfg.email,
      scope: "https://www.googleapis.com/auth/wallet_object.issuer",
      aud: "https://oauth2.googleapis.com/token",
      iat: ahora,
      exp: ahora + 3600,
    },
    cfg.clave,
  );
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!resp.ok) throw new Error(`Token de Google: ${resp.status} ${await resp.text()}`);
  return ((await resp.json()) as { access_token: string }).access_token;
}

const datosPase = (t: TarjetaWallet) => ({
  accountName: t.nombre_completo,
  loyaltyPoints: { label: "Sellos", balance: { string: `${t.sellos_actuales} de ${META}` } },
});

function objetoPase(cfg: Config, enlace: string, t: TarjetaWallet, origen: string) {
  const usuario = t.instagram?.trim().replace(/^@/, "").toLowerCase();
  return {
    id: `${cfg.issuer}.${enlace}`,
    classId: `${cfg.issuer}.${CLASE}`,
    state: "ACTIVE",
    ...datosPase(t),
    ...(usuario && {
      barcode: { type: "QR_CODE", value: `${PREFIJO_QR}${usuario}`, alternateText: `@${usuario}` },
    }),
    textModulesData: [
      {
        id: "premios",
        header: "Premios",
        body: Object.entries(PREMIOS)
          .map(([n, p]) => `Sello ${n}: ${p}.`)
          .join(" "),
      },
    ],
    linksModuleData: {
      uris: [{ id: "tarjeta", description: "Ver mi tarjeta", uri: `${origen}/t/${enlace}` }],
    },
  };
}

// La clase (el "molde" del pase) se crea una vez; 409 = ya existe.
async function asegurarClase(cfg: Config, token: string, origen: string) {
  const resp = await fetch(`${API}/loyaltyClass`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      id: `${cfg.issuer}.${CLASE}`,
      issuerName: MARCA_COMPLETA,
      programName: "Tarjeta de fidelidad",
      programLogo: {
        sourceUri: { uri: `${origen}/icon-512.png` },
        contentDescription: { defaultValue: { language: "es", value: MARCA_COMPLETA } },
      },
      hexBackgroundColor: COLOR_MARCA,
      reviewStatus: "UNDER_REVIEW",
    }),
  });
  if (!resp.ok && resp.status !== 409) throw new Error(`Clase de Wallet: ${resp.status}`);
}

export async function urlGuardarEnWallet(
  cfg: Config,
  enlace: string,
  t: TarjetaWallet,
  origen: string,
) {
  await asegurarClase(cfg, await tokenApi(cfg), origen);
  const ahora = Math.floor(Date.now() / 1000);
  const jwt = firmarJwt(
    {
      iss: cfg.email,
      aud: "google",
      typ: "savetowallet",
      iat: ahora,
      origins: [origen],
      payload: { loyaltyObjects: [objetoPase(cfg, enlace, t, origen)] },
    },
    cfg.clave,
  );
  return `https://pay.google.com/gp/v/save/${jwt}`;
}

// 404 = el cliente nunca guardó el pase: no es error.
export async function actualizarPase(cfg: Config, enlace: string, t: TarjetaWallet) {
  const token = await tokenApi(cfg);
  const resp = await fetch(`${API}/loyaltyObject/${cfg.issuer}.${enlace}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(datosPase(t)),
  });
  if (!resp.ok && resp.status !== 404) {
    throw new Error(`Pase de Wallet: ${resp.status} ${await resp.text()}`);
  }
  return resp.status !== 404;
}

export async function leerTarjeta(enlace: string): Promise<TarjetaWallet | null> {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const clave = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) throw new Error("Faltan variables de Supabase.");
  const { data } = await createClient(url, clave, { auth: { persistSession: false } }).rpc(
    "tarjeta_publica",
    { p_enlace: enlace },
  );
  return ((data as TarjetaWallet[] | null) ?? [])[0] ?? null;
}
