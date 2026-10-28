// ============================================================
// Nuba Ops — formateo de fechas y números (todo en es-ES)
// ============================================================

export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  const s = String(value).trim();
  const d = new Date(s.includes("T") ? s : s.replace(" ", "T"));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fechaCorta(iso) {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function fechaLarga(iso) {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

export function fechaHora(iso) {
  const d = toDate(iso);
  if (!d) return "—";
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function diasDesde(iso) {
  const d = toDate(iso);
  if (!d) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

export function horasHasta(iso) {
  const d = toDate(iso);
  if (!d) return null;
  return (d.getTime() - Date.now()) / 3600000;
}

export function hace(iso) {
  const d = toDate(iso);
  if (!d) return "—";
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const dias = Math.round(h / 24);
  if (dias === 1) return "ayer";
  if (dias < 30) return `hace ${dias} días`;
  return fechaCorta(iso);
}

export function euros(n) {
  const v = Number(n) || 0;
  return v.toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: v % 1 === 0 ? 0 : 2,
  });
}

export function plural(n, singular, plural_) {
  return `${n} ${n === 1 ? singular : plural_ || singular + "s"}`;
}

export function iniciales(nombre = "") {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
