// ============================================================
// Nuba Ops — Capa de datos
// ============================================================
// Lee y escribe en Supabase. Cada cambio se pinta al instante
// y se guarda en la base de datos en segundo plano.
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
  const [a, t, v, av, r] = await Promise.all([
    supabase.from("apartamentos").select("id,nombre,slug,capacidad").order("created_at"),
    supabase.from("tareas").select("*"),
    supabase.from("verificaciones").select("*").order("fecha", { ascending: false }).limit(500),
    supabase.from("averias").select("*").order("fecha_apertura", { ascending: false }),
    supabase.from("reservas").select("*").order("fecha_entrada"),
  ]);

  const error = a.error || t.error || v.error || av.error || r.error;
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
    verificaciones: v.data || [],
    incidencias: av.data || [],
    reservas: r.data || [],
  });
}

const uid = (p = "id") =>
  `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

// --- Lectura -------------------------------------------------
export const apartamentos = () => getDb().apartamentos;
export const tareasDe = (aptoId) => getDb().tareas.filter((t) => t.apartamento_id === aptoId);
export const incidencias = () => getDb().incidencias;
export const reservas = () => getDb().reservas;
export const verificaciones = () => getDb().verificaciones || [];

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
  const aplicables = checklist.filter((x) => !x.no_aplica);
  const revisados = aplicables.filter((x) => x.estado === "completada").length;
  const noAplica = checklist.filter((x) => x.no_aplica).length;
  const abiertas = getDb().incidencias.filter(
    (i) => i.apartamento_id === aptoId && i.estado === "pendiente"
  );
  const { activa } = ocupacion(aptoId);

  return {
    total: t.length,
    checklistTotal: checklist.length,
    aplicables: aplicables.length,
    noAplica,
    hechas: revisados,
    pendientes: aplicables.filter((x) => x.estado !== "completada").length,
    tieneChecklist: checklist.length > 0,
    checklistHechas: revisados,
    progreso: aplicables.length ? Math.round((revisados / aplicables.length) * 100) : 0,
    acciones: t.filter((x) => x.accion_abierta).length,
    incidencias: abiertas.length,
    altaUrgencia: abiertas.filter((i) => i.urgencia === "alta").length,
    ocupada: Boolean(activa),
    reserva: activa,
  };
}

// --- Registro de una comprobación ----------------------------
// datos: { funciona, no_aplica, responsable, notas, patron_accion, foto_url }
export function registrarVerificacion(tareaId, datos = {}) {
  const ahora = new Date().toISOString();
  let fila = null;
  let evento = null;

  commit((db) => {
    const t = db.tareas.find((x) => x.id === tareaId);
    if (!t) return;

    const noAplica = Boolean(datos.no_aplica);
    const funciona = noAplica
      ? null
      : datos.funciona === undefined
      ? true
      : Boolean(datos.funciona);
    const patron = noAplica ? "" : String(datos.patron_accion || "").trim();
    const conFallo = !noAplica && funciona === false;
    const accionAbierta = conFallo && Boolean(patron);

    Object.assign(t, {
      estado: noAplica ? "no_aplica" : "completada",
      funciona,
      no_aplica: noAplica,
      fecha: ahora.slice(0, 10),
      hora: ahora.slice(11, 16),
      responsable: datos.responsable || "",
      notas: datos.notas || "",
      patron_accion: patron,
      accion: conFallo ? patron : "",
      accion_abierta: accionAbierta,
      accion_desde: accionAbierta ? ahora : null,
      foto_url: datos.foto_url || null,
    });
    fila = t;

    evento = {
      id: crypto.randomUUID(),
      tarea_id: t.id,
      apartamento_id: t.apartamento_id,
      item_id: t.item_id,
      nombre: t.nombre,
      tipo: "verificacion",
      fecha: ahora,
      responsable: t.responsable,
      funciona: t.funciona,
      no_aplica: noAplica,
      notas: t.notas,
      patron_accion: patron,
      foto_url: t.foto_url,
    };
    db.verificaciones = [evento, ...(db.verificaciones || [])];
  });

  if (fila && evento) {
    push(
      supabase
        .from("tareas")
        .update({
          estado: fila.estado,
          funciona: fila.funciona,
          no_aplica: fila.no_aplica,
          fecha: fila.fecha,
          hora: fila.hora,
          responsable: fila.responsable,
          notas: fila.notas,
          patron_accion: fila.patron_accion,
          accion: fila.accion,
          accion_abierta: fila.accion_abierta,
          accion_desde: fila.accion_desde,
          foto_url: fila.foto_url,
          updated_at: ahora,
        })
        .eq("id", tareaId)
    );
    push(supabase.from("verificaciones").insert(evento));
  }

  return evento;
}

export function marcarNoAplica(tareaId, responsable = "") {
  return registrarVerificacion(tareaId, { no_aplica: true, responsable });
}

// Deshacer: el punto vuelve a pendiente (sin borrar el historial)
export function volverAPendiente(tareaId) {
  let fila = null;
  commit((db) => {
    const t = db.tareas.find((x) => x.id === tareaId);
    if (!t) return;
    t.estado = "pendiente";
    t.no_aplica = false;
    t.funciona = null;
    t.accion_abierta = false;
    t.accion = "";
    t.accion_desde = null;
    fila = t;
  });
  if (fila) {
    push(
      supabase
        .from("tareas")
        .update({
          estado: "pendiente",
          no_aplica: false,
          funciona: null,
          accion_abierta: false,
          accion: "",
          accion_desde: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tareaId)
    );
  }
}

// --- Alarmas de patrón de acción -----------------------------
export function pendientesAccion() {
  return getDb()
    .tareas.filter((t) => t.accion_abierta)
    .sort((a, b) => new Date(a.accion_desde || 0) - new Date(b.accion_desde || 0));
}

export function resolverAccion(tareaId, { responsable = "", nota = "" } = {}) {
  const ahora = new Date().toISOString();
  let evento = null;

  commit((db) => {
    const t = db.tareas.find((x) => x.id === tareaId);
    if (!t) return;

    t.accion_abierta = false;
    t.accion = "";
    t.accion_desde = null;

    evento = {
      id: crypto.randomUUID(),
      tarea_id: t.id,
      apartamento_id: t.apartamento_id,
      item_id: t.item_id,
      nombre: t.nombre,
      tipo: "resolucion",
      fecha: ahora,
      responsable,
      funciona: true,
      no_aplica: false,
      notas: nota,
      patron_accion: "",
      foto_url: null,
    };
    db.verificaciones = [evento, ...(db.verificaciones || [])];
  });

  if (evento) {
    push(
      supabase
        .from("tareas")
        .update({ accion_abierta: false, accion: "", accion_desde: null, updated_at: ahora })
        .eq("id", tareaId)
    );
    push(supabase.from("verificaciones").insert(evento));
  }
}

// --- Tareas --------------------------------------------------
export function actualizarTarea(id, patch) {
  let fila = null;
  commit((db) => {
    const t = db.tareas.find((x) => x.id === id);
    if (!t) return;
    Object.assign(t, patch);
    fila = t;
  });
  if (fila) {
    push(
      supabase
        .from("tareas")
        .update({
          frecuencia: fila.frecuencia,
          nombre: fila.nombre,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
    );
  }
}

export function crearTarea(aptoId, nombre, grupo = "otros") {
  const fila = {
    id: uid("t"),
    apartamento_id: aptoId,
    item_id: null,
    nombre: nombre.trim(),
    grupo,
    frecuencia: "Mensualmente",
    estado: "pendiente",
    funciona: null,
    no_aplica: false,
    accion: "",
    accion_abierta: false,
    accion_desde: null,
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

// --- Reservas ------------------------------------------------
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

// --- Apartamentos --------------------------------------------
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

// --- Fotos ---------------------------------------------------
export async function subirFoto(file) {
  if (MODO === "supabase") {
    const { blob, original } = await prepararImagen(file);
    const ext = original ? file.name.split(".").pop() || "jpg" : "jpg";
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

// --- Datos derivados -----------------------------------------
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
