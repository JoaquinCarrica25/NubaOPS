// ============================================================
// Nuba Ops — Prevención (checklist de 31 puntos)
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Camera,
  Plus,
  Search,
  Trash2,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { useToast } from "../context/ToastContext.jsx";
import {
  actualizarTarea,
  crearTarea,
  eliminarTarea,
  resumenApartamento,
  subirFoto,
  ocupacion,
} from "../lib/api.js";
import { GRUPOS, FRECUENCIAS, RESPONSABLES } from "../lib/seed.js";
import {
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Pill,
  Progress,
  Ring,
  Segmented,
  Sheet,
  cx,
} from "../components/ui.jsx";
import { fechaCorta, hace, plural } from "../lib/format.js";

function SelectorApartamento({ aptos, actual, onElegir }) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");

  const lista = aptos.filter((a) => a.nombre.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-white px-3 py-2.5 text-left shadow-sm transition hover:border-ink-3/40"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/5 text-brand">
          <ShieldCheck size={14} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            Apartamento
          </span>
          <span className="block truncate text-[14px] font-bold leading-tight text-ink">
            {actual?.nombre}
          </span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-ink-3" />
      </button>

      <Sheet open={abierto} onClose={() => setAbierto(false)} title="Elegir apartamento">
        <div className="relative mb-3">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar…"
            className="field-input pl-9"
          />
        </div>
        <div className="space-y-1">
          {lista.map((a) => {
            const r = resumenApartamento(a.id);
            return (
              <button
                key={a.id}
                onClick={() => {
                  onElegir(a.slug || a.id);
                  setAbierto(false);
                }}
                className={cx(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition",
                  a.id === actual?.id ? "bg-accent-soft" : "hover:bg-canvas"
                )}
              >
                <span
                  className={cx("h-1.5 w-1.5 shrink-0 rounded-full", r.ocupada ? "bg-ok" : "bg-line")}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">
                    {a.nombre}
                  </span>
                  <span className="block text-[11px] text-ink-3">
                    {r.hechas}/{r.total} puntos · {r.ocupada ? "ocupado" : "libre"}
                  </span>
                </span>
                <span className="w-16 shrink-0">
                  <Progress value={r.progreso} tone={r.progreso === 100 ? "ok" : "accent"} />
                </span>
              </button>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}

function ItemRow({ tarea, onCambio }) {
  const [abierto, setAbierto] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [notas, setNotas] = useState(tarea.notas || "");
  const fileRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    setNotas(tarea.notas || "");
  }, [tarea.notas]);

  const hecha = tarea.estado === "completada";

  const alternar = () => {
    onCambio({ estado: hecha ? "pendiente" : "completada" });
  };

  const subir = async (file) => {
    if (!file) return;
    setSubiendo(true);
    try {
      const url = await subirFoto(file);
      onCambio({ foto_url: url });
      toast("Foto guardada", "ok");
    } catch (e) {
      toast(`No se pudo subir la foto: ${e.message}`, "error", 4000);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className={cx("transition-colors", abierto && "bg-canvas/40")}>
      <div className="flex items-start gap-3 px-3.5 py-2.5 sm:px-4">
        <button
          onClick={alternar}
          aria-pressed={hecha}
          aria-label={hecha ? "Marcar como pendiente" : "Marcar como comprobado"}
          className={cx(
            "mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90",
            hecha
              ? "border-ok bg-ok text-white"
              : "border-line bg-white text-transparent hover:border-accent"
          )}
        >
          <Check size={13} strokeWidth={3} />
        </button>

        <button
          onClick={() => setAbierto((v) => !v)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={abierto}
        >
          <div className="flex items-center gap-2">
            <p
              className={cx(
                "truncate text-[13.5px] font-semibold leading-snug",
                hecha ? "text-ink-3 line-through decoration-line" : "text-ink"
              )}
            >
              {tarea.nombre}
            </p>
            {tarea.funciona === false && <Pill tone="bad">No funciona</Pill>}
            {tarea.extra && <Pill tone="accent">Extra</Pill>}
          </div>
          <p className="mt-0.5 truncate text-[12px] text-ink-3">
            {hecha
              ? `${fechaCorta(tarea.fecha)}${tarea.responsable ? ` · ${tarea.responsable}` : ""}${
                  tarea.notas ? ` · ${tarea.notas}` : ""
                }`
              : tarea.observacion}
          </p>
        </button>

        {tarea.foto_url && (
          <a
            href={tarea.foto_url}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-line"
          >
            <img src={tarea.foto_url} alt="" className="h-full w-full object-cover" />
          </a>
        )}

        <button
          onClick={() => setAbierto((v) => !v)}
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-3 transition hover:bg-canvas"
          aria-label="Detalles"
        >
          <ChevronDown
            size={15}
            className={cx("transition-transform duration-200", abierto && "rotate-180")}
          />
        </button>
      </div>

      {abierto && (
        <div className="animate-rise space-y-3 border-t border-line/70 px-3.5 pb-4 pt-3 sm:px-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Frecuencia">
              <select
                value={tarea.frecuencia}
                onChange={(e) => onCambio({ frecuencia: e.target.value })}
                className="field-input py-2 text-[13px]"
              >
                {FRECUENCIAS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Responsable">
              <select
                value={tarea.responsable || ""}
                onChange={(e) => onCambio({ responsable: e.target.value })}
                className="field-input py-2 text-[13px]"
              >
                <option value="">—</option>
                {RESPONSABLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="¿Funciona?">
            <div className="flex gap-2">
              {[
                { v: true, label: "Sí" },
                { v: false, label: "No" },
                { v: null, label: "Sin revisar" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  onClick={() => onCambio({ funciona: o.v })}
                  className={cx(
                    "flex-1 rounded-xl border px-2 py-1.5 text-[12.5px] font-semibold transition",
                    tarea.funciona === o.v
                      ? o.v === false
                        ? "border-bad bg-bad-soft text-bad"
                        : o.v === true
                        ? "border-ok bg-ok-soft text-ok"
                        : "border-ink-3/40 bg-canvas text-ink-2"
                      : "border-line bg-white text-ink-3 hover:border-ink-3/40"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Notas">
            <textarea
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              onBlur={() => notas !== (tarea.notas || "") && onCambio({ notas })}
              placeholder="Qué se ha visto, qué se ha cambiado…"
              className="field-input resize-none py-2 text-[13px]"
            />
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                subir(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              size="sm"
              variant="soft"
              onClick={() => fileRef.current?.click()}
              disabled={subiendo}
            >
              {subiendo ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
              {subiendo ? "Subiendo…" : tarea.foto_url ? "Cambiar foto" : "Añadir foto"}
            </Button>

            {tarea.foto_url && (
              <button
                onClick={() => onCambio({ foto_url: null })}
                className="text-[12px] font-medium text-ink-3 hover:text-bad"
              >
                Quitar foto
              </button>
            )}

            {tarea.extra && (
              <button
                onClick={() => eliminarTarea(tarea.id)}
                className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-ink-3 transition hover:text-bad"
              >
                <Trash2 size={13} /> Eliminar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Prevencion() {
  const db = useDb();
  const [params, setParams] = useSearchParams();
  const [vista, setVista] = useState("pendientes");
  const [q, setQ] = useState("");
  const [nueva, setNueva] = useState("");
  const { toast } = useToast();

  const param = params.get("apto");
  const apto =
    db.apartamentos.find((a) => a.slug === param || a.id === param) || db.apartamentos[0] || null;
  const aptoId = apto?.id;
  const idx = db.apartamentos.findIndex((a) => a.id === aptoId);

  useEffect(() => {
    if (!param && apto) {
      setParams({ apto: apto.slug || apto.id }, { replace: true });
    }
  }, [param, apto, setParams]);

  const tareas = db.tareas.filter((t) => t.apartamento_id === aptoId);
  const hechas = tareas.filter((t) => t.estado === "completada").length;
  const pendientes = tareas.length - hechas;
  const progreso = tareas.length ? Math.round((hechas / tareas.length) * 100) : 0;
  const occ = apto ? ocupacion(apto.id) : { activa: null };
  const ultima = tareas
    .filter((t) => t.fecha)
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))[0]?.fecha;

  const visibles = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tareas.filter((t) => {
      if (vista === "pendientes" && t.estado === "completada") return false;
      if (vista === "hechos" && t.estado !== "completada") return false;
      if (term && !`${t.nombre} ${t.notas}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [tareas, vista, q]);

  const porGrupo = useMemo(() => {
    const mapa = new Map();
    for (const g of GRUPOS) mapa.set(g.key, { ...g, items: [] });
    for (const t of visibles) {
      if (!mapa.has(t.grupo)) mapa.set(t.grupo, { key: t.grupo, label: "Otros", items: [] });
      mapa.get(t.grupo).items.push(t);
    }
    return [...mapa.values()].filter((g) => g.items.length > 0);
  }, [visibles]);

  const totalesGrupo = useMemo(() => {
    const m = {};
    for (const t of tareas) {
      const k = t.grupo || "otros";
      if (!m[k]) m[k] = { total: 0, hechas: 0 };
      m[k].total += 1;
      if (t.estado === "completada") m[k].hechas += 1;
    }
    return m;
  }, [tareas]);

  const cambiar = (id, patch) => actualizarTarea(id, patch);

  const anadir = () => {
    const nombre = nueva.trim();
    if (!nombre) return;
    crearTarea(aptoId, nombre);
    setNueva("");
    toast("Tarea añadida", "ok");
  };

  const mover = (delta) => {
    const siguiente = db.apartamentos[idx + delta];
    if (siguiente) setParams({ apto: siguiente.slug || siguiente.id });
  };

  if (!apto) return null;

  return (
    <div className="space-y-3.5">
      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <SelectorApartamento
            aptos={db.apartamentos}
            actual={apto}
            onElegir={(id) => setParams({ apto: id })}
          />
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-xl border border-line bg-white px-1 shadow-sm">
          <IconButton label="Anterior" onClick={() => mover(-1)} disabled={idx <= 0}>
            <ChevronLeft size={17} className={idx <= 0 ? "opacity-30" : ""} />
          </IconButton>
          <IconButton
            label="Siguiente"
            onClick={() => mover(1)}
            disabled={idx >= db.apartamentos.length - 1}
          >
            <ChevronRight
              size={17}
              className={idx >= db.apartamentos.length - 1 ? "opacity-30" : ""}
            />
          </IconButton>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-4">
          <Ring value={progreso} size={58} stroke={6} tone={progreso === 100 ? "ok" : "accent"} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-bold tracking-tight text-ink">{apto.nombre}</h2>
              <Pill tone={occ.activa ? "ok" : "neutral"} dot>
                {occ.activa ? "Ocupado" : "Libre"}
              </Pill>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-3">
              {hechas} de {tareas.length} puntos · {plural(pendientes, "pendiente", "pendientes")}
            </p>
            <p className="mt-0.5 text-[11.5px] text-ink-3">
              {ultima ? `Última revisión ${hace(ultima)}` : "Sin revisiones registradas"}
            </p>
          </div>
        </div>
        <div className="px-4 pb-3.5">
          <Progress value={progreso} tone={progreso === 100 ? "ok" : "accent"} />
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Segmented
          value={vista}
          onChange={setVista}
          options={[
            { value: "pendientes", label: "Pendientes", count: pendientes },
            { value: "todos", label: "Todos", count: tareas.length },
            { value: "hechos", label: "Hechos", count: hechas },
          ]}
        />
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar punto…"
            className="field-input h-9 py-0 pl-9 text-[13px]"
          />
        </div>
      </div>

      {porGrupo.length === 0 ? (
        <Card>
          <EmptyState
            icon={ShieldCheck}
            title={vista === "pendientes" ? "Todo comprobado" : "Nada que mostrar"}
            text={
              vista === "pendientes"
                ? "No queda ningún punto pendiente en este apartamento."
                : "Prueba con otra búsqueda o cambia el filtro."
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {porGrupo.map((g) => (
            <Card key={g.key} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-canvas/50 px-3.5 py-2 sm:px-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.09em] text-ink-3">
                  {g.label}
                </h3>
                <span className="text-[11px] font-medium tabular-nums text-ink-3">
                  {totalesGrupo[g.key]?.hechas ?? 0}/{totalesGrupo[g.key]?.total ?? g.items.length}
                </span>
              </div>
              <div className="divide-y divide-line/70">
                {g.items.map((t) => (
                  <ItemRow key={t.id} tarea={t} onCambio={(patch) => cambiar(t.id, patch)} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="flex items-center gap-2 p-2">
        <Plus size={16} className="ml-2 shrink-0 text-ink-3" />
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && anadir()}
          placeholder={`Añadir tarea a ${apto.nombre}…`}
          className="h-9 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-3"
        />
        <Button size="sm" variant="outline" onClick={anadir} disabled={!nueva.trim()}>
          Añadir
        </Button>
      </Card>

      <p className="px-1 pb-2 text-center text-[11px] text-ink-3">
        {plural(pendientes, "punto pendiente", "puntos pendientes")} · los cambios se guardan solos
      </p>
    </div>
  );
}
