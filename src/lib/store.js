// ============================================================
// Nuba Ops — Almacén de datos en memoria
// ============================================================

import { APARTAMENTOS, ITEMS, itemsDe, RESPONSABLES } from "./seed.js";

const KEY = "nuba-ops:db:v1";

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const pick = (arr, r) => arr[Math.floor(r() * arr.length) % arr.length];
const iso = (d) => new Date(d).toISOString();
const diasAtras = (n) => iso(Date.now() - n * 86400000);

export function crearDemo() {
  const tareas = [];
  APARTAMENTOS.forEach((apt, i) => {
    const r = rng(hash(apt.id) + 7);
    const nivel = [0.92, 0.45, 0.08, 0.7, 1, 0.3][i % 6];
    for (const it of itemsDe(apt.id)) {
      const hecha = r() < nivel;
      tareas.push({
        id: `t-${apt.id}-${it.id}`,
        apartamento_id: apt.id,
        item_id: it.id,
        nombre: it.nombre,
        grupo: it.grupo,
        frecuencia: "Semanalmente",
        estado: hecha ? "completada" : "pendiente",
        funciona: hecha ? true : null,
        no_aplica: false,
        accion: "",
        accion_abierta: false,
        accion_desde: null,
        fecha: hecha ? diasAtras(Math.floor(r() * 16)).slice(0, 10) : null,
        hora: null,
        responsable: hecha ? pick(RESPONSABLES, r) : "",
        notas: "",
        patron_accion: "",
        foto_url: null,
        extra: false,
      });
    }
  });

  return {
    version: 1,
    apartamentos: APARTAMENTOS.map((a) => ({ ...a })),
    tareas,
    verificaciones: [],
    incidencias: [],
    reservas: [],
    historial: [],
  };
}

function cargar() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const db = JSON.parse(raw);
    if (!db || db.version !== 1) return null;
    return db;
  } catch {
    return null;
  }
}

let db = cargar() || crearDemo();
const listeners = new Set();

function persistir() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch (e) {
    console.warn("No se pudo guardar en localStorage", e);
  }
}

export function getDb() {
  return db;
}

/** Sustituye toda la base por la que llega de Supabase. */
export function hidratar(datos) {
  db = {
    version: 1,
    apartamentos: datos.apartamentos || [],
    tareas: datos.tareas || [],
    verificaciones: datos.verificaciones || [],
    incidencias: datos.incidencias || [],
    reservas: datos.reservas || [],
    historial: [],
  };
  persistir();
  listeners.forEach((l) => l());
}

export function commit(fn) {
  fn(db);
  db = { ...db };
  persistir();
  listeners.forEach((l) => l());
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function resetDemo() {
  db = crearDemo();
  persistir();
  listeners.forEach((l) => l());
}

export { ITEMS };
