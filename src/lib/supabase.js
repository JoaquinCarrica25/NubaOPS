// ============================================================
// Nuba Ops — Conexión con Supabase
// ============================================================
// La URL y la clave pública van aquí escritas para que la app
// funcione sin configurar nada en Vercel. Son claves públicas:
// viajan igualmente en el JavaScript que descarga el navegador.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const URL_POR_DEFECTO = "https://emhlqlwdiwckvufovyhi.supabase.co";
const CLAVE_POR_DEFECTO = "sb_publishable_4ukFFAdDqpTYhUPBBeSJZQ_SDJRNxOV";

let cliente = null;

export function getSupabase() {
  if (cliente) return cliente;

  const url = import.meta.env.VITE_SUPABASE_URL || URL_POR_DEFECTO;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || CLAVE_POR_DEFECTO;

  cliente = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "nuba-ops-session",
    },
  });
  return cliente;
}
