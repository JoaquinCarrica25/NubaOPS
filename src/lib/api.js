// ============================================================
// Nuba Ops — Capa de datos
// ============================================================
// Toda la interfaz habla con estas funciones: leen y escriben
// en Supabase. Cada cambio se pinta al instante en pantalla y
// se guarda en la base de datos en segundo plano.
// ============================================================

import { getDb, commit, subscribe, resetDemo, hidratar } from "./store.js";
import { prepararImagen } from "./imagen.js";
import { getSupabase } from "./supabase.js";
import { itemsDe, ITEMS, APARTAMENTOS } from "./seed.js";

const supabase = getSupabase();
export const MODO = supabase ? "supabase" : "demo";

export { subscribe, resetDemo };

function push(promesa) {
  if (!supabase) return;
  Promise.resolve(promesa)
    .then(({ error }) => {
      if (error) console.error("Supabase:", error.message, error.details || "");
    })
    .catch((e) => console.error("Supabase:", e.message));
}

export async function cargarTodo() {
  if (!supabase) return;
  const [a, t, av, r] = await Promise.all([
    supabase.from("apartamentos").select("id,nombre,slug,capacidad").order("created_at"),
    supabase.from("tareas").select("*"),
    supabase.from("averias").select("*").order("fecha_apertura", { ascending: false }),
    supabase.from("reservas").select("*").order("fecha_entrada"),
  ]);

  const error = a.error || t.error || av.error || r.error;
  if (error) throw new Error(error.message);

  const bonito = new Map(APARTAMENTOS.map((x) => [x.id, x.nombre]));
  const orden = new Map(APARTAMENTOS.map((x, i) => [x.id, i]));

  const apartamentos = (a.data || [])
    .map((x) => ({
      id: x.id,
      slug: x.slug || x.id,
      nombre: bonito.get(x.slug) || x.nombre,
      capacidad: x.capacidad,
    }))
    .sort((x, y) => (orden.get(x.slug) ?? 99) - (orden.get(y.slug) ?? 99));

  hidratar({
    apartamentos,
    tareas: t.data || [],
    incidencias: av.data || [],
    reservas: r.data || [],
  });
}

export function useDbSnapshot() {
  return getDb();
}

const uid = (p = "id") =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// --- Lectura -------------------------------------------------
export const apartamentos = () => getDb().apartamentos;
export const tareasDe = (aptoId) => getDb().tareas.filter((t) => t.apartamento_id === aptoId);
export const incidencias = () => getDb().incidencias;
export const reservas = () => getDb().reservas;

export function ocupacion(aptoId) {
  const ahora = Date.now();
  const lista = getDb().reservas.filter((r) => r.apartamento_id === aptoId);
  const activa = lista.find(
    (r) => new Date(r.fecha_entrada).getTime() <= ahora && new Date(r.fecha_salida).getTime() >= ahora
  );
  const proxima = lista
    .filter((r) => new Date(r.fecha_entrada).getTime() > ahora)
    .sort((a, b) => new Date(a.fecha_entrada) - new Date(b.fecha_entrada))[0];
  return { activa: activa || null, proxima: proxima || null };
}

export function resumenApartamento(aptoId) {
  const t = tareasDe(aptoId);
  const checklist = t.filter((x) => x.item_id != null);
  const hechasCheck = checklist.filter((x) => x.estado === "completada").length;
  const abiertas = getDb().incidencias.filter(
    (i) => i.apartamento_id === aptoId && i.estado === "pendiente"
  );
  const { activa } = ocupacion(aptoId);
  return {
    total: t.length,
    hechas: t.filter((x) => x.estado === "completada").length,
    pendientes: t.filter((x) => x.estado !== "completada").length,
    tieneChecklist: checklist.length > 0,
    checklistTotal: checklist.length,
    checklistHechas: hechasCheck,
    progreso: checklist.length ? Math.round((hechasCheck / checklist.length) * 100) : 0,
    incidencias: abiertas.length,
    altaUrgencia: abiertas.filter((i) => i.urgencia === "alta").length,
    ocupada: Boolean(activa),
    reserva: activa,
  };
}

// --- Tareas / prevención -------------------------------------
export function actualizarTarea(id, patch) {
  let fila = null;
  commit((db) => {
    const t = db.tareas.find((x) => x.id === id);
    if (!t) return;
    Object.assign(t, patch);
    if (patch.estado === "completada" && !t.fecha) {
      const hoy = new Date();
      t.fecha = hoy.toISOString().slice(0, 10);
      t.hora = hoy.toTimeString().slice(0, 5);
    }
    fila = t;
  });
  if (fila) {
    push(
      supabase
        .from("tareas")
        .update({
          estado: fila.estado,
          funciona: fila.funciona,
          fecha: fila.fecha,
          hora: fila.hora,
          responsable: fila.responsable,
          notas: fila.notas,
          frecuencia: fila.frecuencia,
          nombre: fila.nombre,
          foto_url: fila.foto_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
    );
  }
}

export function crearTarea(aptoId, nombre, grupo = "cocina") {
  const fila = {
    id: uid("t"),
    apartamento_id: aptoId,
    item_id: null,
    nombre: nombre.trim(),
    grupo,
    frecuencia: "Mensualmente",
    estado: "pendiente",
    funciona: null,
    fecha: null,
    hora: null,
    responsable: "",
    notas: "",
    patron_accion: "",
    foto_url: null,
    extra: true,
  };
  commit((db) => {
    db.tareas.push(fila);
  });
  push(supabase.from("tareas").insert(fila));
  return fila.id;
}

export function eliminarTarea(id) {
  commit((db) => {
    db.tareas = db.tareas.filter((t) => t.id !== id);
  });
  push(supabase.from("tareas").delete().eq("id", id));
}

// --- Reservas -------------------------------------------------
export function crearReserva({ apartamento_id, entrada, salida, huespedes, notas }) {
  const fila = {
    id: crypto.randomUUID(),
    apartamento_id,
    fecha_entrada: entrada,
    fecha_salida: salida,
    huespedes: Number(huespedes) || 1,
    notas: notas || "",
  };
  commit((db) => {
    db.reservas.push(fila);
    db.reservas.sort((a, b) => new Date(a.fecha_entrada) - new Date(b.fecha_entrada));
  });
  push(supabase.from("reservas").insert(fila));
  return fila.id;
}

export function actualizarReserva(id, patch) {
  commit((db) => {
    const r = db.reservas.find((x) => x.id === id);
    if (r) Object.assign(r, patch);
  });
  push(supabase.from("reservas").update(patch).eq("id", id));
}

export function eliminarReserva(id) {
  commit((db) => {
    db.reservas = db.reservas.filter((r) => r.id !== id);
  });
  push(supabase.from("reservas").delete().eq("id", id));
}

// --- Apartamentos ---------------------------------------------
export function actualizarApartamento(id, patch) {
  commit((db) => {
    const a = db.apartamentos.find((x) => x.id === id);
    if (a) Object.assign(a, patch);
  });
  push(supabase.from("apartamentos").update(patch).eq("id", id));
}

// --- Incidencias ---------------------------------------------
export function crearIncidencia(data) {
  const fila = {
    id: crypto.randomUUID(),
    apartamento_id: data.apartamento_id,
    descripcion: data.descripcion,
    urgencia: data.urgencia || "media",
    estado: "pendiente",
    responsable: data.responsable || "",
    patron_accion: data.patron_accion || "",
    alerta_horas: data.alerta_horas || 48,
    fecha_apertura: new Date().toISOString(),
    fecha_cierre: null,
    quien_reparo: "",
    coste: 0,
    observaciones: "",
    foto_apertura_url: data.foto_url || null,
    foto_cierre_url: null,
  };
  commit((db) => {
    db.incidencias.unshift(fila);
  });
  push(supabase.from("averias").insert(fila));
  return fila.id;
}

export function actualizarIncidencia(id, patch) {
  commit((db) => {
    const i = db.incidencias.find((x) => x.id === id);
    if (i) Object.assign(i, patch);
  });
  push(supabase.from("averias").update(patch).eq("id", id));
}

export function resolverIncidencia(id, { quien_reparo, coste, observaciones, foto_url }) {
  const patch = {
    estado: "resuelta",
    fecha_cierre: new Date().toISOString(),
    quien_reparo: quien_reparo || "",
    coste: Number(coste) || 0,
    observaciones: observaciones || "",
    foto_cierre_url: foto_url || null,
  };
  commit((db) => {
    const i = db.incidencias.find((x) => x.id === id);
    if (i) Object.assign(i, patch);
  });
  push(supabase.from("averias").update(patch).eq("id", id));
}

export function reabrirIncidencia(id) {
  const patch = { estado: "pendiente", fecha_cierre: null };
  commit((db) => {
    const i = db.incidencias.find((x) => x.id === id);
    if (i) Object.assign(i, patch);
  });
  push(supabase.from("averias").update(patch).eq("id", id));
}

// --- Fotos ----------------------------------------------------
export async function subirFoto(file) {
  if (MODO === "supabase") {
    const { blob, original } = await prepararImagen(file);
    const ext = original ? (file.name.split(".").pop() || "jpg") : "jpg";
    const path = `evidencias/${new Date().getFullYear()}/${uid("f")}.${ext}`;
    const { error } = await supabase.storage
      .from("evidencias")
      .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
    if (error) throw new Error(error.message);
    return supabase.storage.from("evidencias").getPublicUrl(path).data.publicUrl;
  }

  const { dataUrl, blob } = await prepararImagen(file);
  if (dataUrl) return dataUrl;
  return await blobToMiniatura(blob);
}

function blobToMiniatura(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const max = 700;
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.65));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };
    img.src = url;
  });
}

// --- Datos derivados útiles ----------------------------------
export function urgenciasAbiertas() {
  return getDb()
    .incidencias.filter((i) => i.estado === "pendiente")
    .sort((a, b) => {
      const o = { alta: 0, media: 1, baja: 2 };
      return o[a.urgencia] - o[b.urgencia] || new Date(a.fecha_apertura) - new Date(b.fecha_apertura);
    });
}

export function proximosCheckouts(horas = 48) {
  const ahora = Date.now();
  return getDb()
    .reservas.filter((r) => {
      const salida = new Date(r.fecha_salida).getTime();
      return salida >= ahora && salida - ahora <= horas * 3600000;
    })
    .sort((a, b) => new Date(a.fecha_salida) - new Date(b.fecha_salida));
}

export function costeMes() {
  const ahora = new Date();
  return getDb()
    .incidencias.filter((i) => {
      if (i.estado !== "resuelta" || !i.fecha_cierre) return false;
      const d = new Date(i.fecha_cierre);
      return d.getMonth() === ahora.getMonth() && d.getFullYear() === ahora.getFullYear();
    })
    .reduce((s, i) => s + (Number(i.coste) || 0), 0);
}

export function mediaPrevencion() {
  const conChecklist = getDb().apartamentos.filter((a) => resumenApartamento(a.id).tieneChecklist);
  if (!conChecklist.length) return 0;
  const valores = conChecklist.map((a) => resumenApartamento(a.id).progreso);
  return Math.round(valores.reduce((s, v) => s + v, 0) / valores.length);
}

export { itemsDe, ITEMS };
