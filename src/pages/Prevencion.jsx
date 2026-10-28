// ============================================================
// Nuba Ops — Prevención (checklist + modo repaso)
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
  X,
  AlertTriangle,
  Minus,
  RotateCcw,
} from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { useSession } from "../context/SessionContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  actualizarTarea,
  crearTarea,
  eliminarTarea,
  resumenApartamento,
  subirFoto,
  ocupacion,
  registrarVerificacion,
  marcarNoAplica,
  volverAPendiente,
} from "../lib/api.js";
import { GRUPOS, FRECUENCIAS } from "../lib/seed.js";
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
import { fechaCorta, fechaHora, hace, plural } from "../lib/format.js";

// ---------- Selector de apartamento --------------------------
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
                    {r.pendientes === 0
                      ? `${r.aplicables} puntos al día`
                      : `${r.pendientes} pendientes de ${r.aplicables}`}
                    {r.acciones > 0 ? ` · ${r.acciones} con acción` : ""}
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

// ---------- Modo repaso: un punto cada vez -------------------
function ModoRepaso({ ids, perfil, onCerrar }) {
  const db = useDb();
  const { toast } = useToast();
  const [i, setI] = useState(0);
  const [fase, setFase] = useState("pregunta");
  const [patron, setPatron] = useState("");
  const [notas, setNotas] = useState("");
  const [foto, setFoto] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [cuenta, setCuenta] = useState({ ok: 0, fallo: 0, na: 0 });
  const fileRef = useRef(null);

  const tarea = ids[i] ? db.tareas.find((t) => t.id === ids[i]) : null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const avanzar = () => {
    setFase("pregunta");
    setPatron("");
    setNotas("");
    setFoto(null);
    setI((x) => x + 1);
  };

  const siFunciona = () => {
    registrarVerificacion(tarea.id, { funciona: true, responsable: perfil });
    setCuenta((c) => ({ ...c, ok: c.ok + 1 }));
    avanzar();
  };

  const noFunciona = () => setFase("fallo");

  const noAplica = () => {
    marcarNoAplica(tarea.id, perfil);
    setCuenta((c) => ({ ...c, na: c.na + 1 }));
    avanzar();
  };

  const guardarFallo = () => {
    if (!patron.trim()) {
      toast("Escribe qué hay que hacer", "error");
      return;
    }
    registrarVerificacion(tarea.id, {
      funciona: false,
      patron_accion: patron,
      notas,
      foto_url: foto,
      responsable: perfil,
    });
    setCuenta((c) => ({ ...c, fallo: c.fallo + 1 }));
    toast("Alerta creada en Pendientes", "info");
    avanzar();
  };

  const subir = async (file) => {
    if (!file) return;
    setSubiendo(true);
    try {
      setFoto(await subirFoto(file));
    } catch (e) {
      toast(`No se pudo subir la foto: ${e.message}`, "error", 4000);
    } finally {
      setSubiendo(false);
    }
  };

  const total = ids.length;
  const terminado = !tarea;
  const pct = Math.round((i / total) * 100);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-canvas">
      {/* Cabecera */}
      <div className="shrink-0 border-b border-line bg-surface px-4 pb-3 pt-4">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              Repaso
            </p>
            <p className="truncate text-[13px] font-semibold text-ink">
              {terminado ? "Terminado" : `Punto ${i + 1} de ${total}`}
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ink-2 transition hover:bg-canvas"
            aria-label="Salir del repaso"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mx-auto mt-3 max-w-lg">
          <Progress value={terminado ? 100 : pct} tone="accent" />
        </div>
      </div>

      {/* Cuerpo */}
      <div className="scroll-slim flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center">
          {terminado ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-ok-soft">
                <Check size={38} className="text-ok" strokeWidth={3} />
              </div>
              <p className="text-[22px] font-bold tracking-tight text-ink">
                {total} de {total} repasados
              </p>
              <p className="mt-1.5 text-[13.5px] text-ink-3">Todo queda registrado en el historial.</p>

              <div className="mx-auto mt-6 grid max-w-sm grid-cols-3 gap-2">
                <div className="rounded-xl border border-line bg-white p-3">
                  <p className="text-[20px] font-bold text-ok">{cuenta.ok}</p>
                  <p className="text-[11px] text-ink-3">Correctos</p>
                </div>
                <div className="rounded-xl border border-line bg-white p-3">
                  <p className="text-[20px] font-bold text-bad">{cuenta.fallo}</p>
                  <p className="text-[11px] text-ink-3">Con acción</p>
                </div>
                <div className="rounded-xl border border-line bg-white p-3">
                  <p className="text-[20px] font-bold text-ink-2">{cuenta.na}</p>
                  <p className="text-[11px] text-ink-3">No aplica</p>
                </div>
              </div>

              {cuenta.fallo > 0 && (
                <p className="mx-auto mt-4 max-w-sm rounded-xl bg-warn-soft px-3 py-2.5 text-[12.5px] font-medium text-warn">
                  {cuenta.fallo === 1
                    ? "1 punto se ha ido a Pendientes como alarma."
                    : `${cuenta.fallo} puntos se han ido a Pendientes como alarmas.`}
                </p>
              )}

              <Button className="mx-auto mt-6 w-full max-w-sm" onClick={onCerrar}>
                Cerrar
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-lg bg-brand/5 px-2 py-1 text-[11px] font-bold tabular-nums text-brand">
                  {tarea.item_id ?? "·"}
                </span>
                {tarea.estado === "completada" && (
                  <Pill tone={tarea.funciona === false ? "bad" : "ok"}>
                    {tarea.no_aplica ? "No aplica" : tarea.funciona === false ? "Con acción" : "Ya comprobado"}
                  </Pill>
                )}
              </div>

              <h2 className="text-[26px] font-bold leading-tight tracking-tight text-ink">
                {tarea.nombre}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{tarea.observacion}</p>

              {fase === "pregunta" ? (
                <div className="mt-7 space-y-2.5">
                  <button
                    onClick={siFunciona}
                    className="flex h-16 w-full items-center gap-3 rounded-2xl bg-ok px-5 text-left text-white shadow-sm transition active:scale-[0.99]"
                  >
                    <Check size={24} strokeWidth={3} />
                    <span className="text-[17px] font-bold">Funciona</span>
                  </button>

                  <button
                    onClick={noFunciona}
                    className="flex h-16 w-full items-center gap-3 rounded-2xl bg-bad px-5 text-left text-white shadow-sm transition active:scale-[0.99]"
                  >
                    <AlertTriangle size={22} strokeWidth={2.4} />
                    <span className="text-[17px] font-bold">No funciona</span>
                  </button>

                  <button
                    onClick={noAplica}
                    className="flex h-14 w-full items-center gap-3 rounded-2xl border-2 border-line bg-white px-5 text-left text-ink-2 transition active:scale-[0.99]"
                  >
                    <Minus size={20} strokeWidth={2.6} />
                    <span className="text-[15px] font-bold">No aplica en este piso</span>
                  </button>

                  <button
                    onClick={avanzar}
                    className="mx-auto mt-2 block text-[13px] font-medium text-ink-3 transition hover:text-ink"
                  >
                    Saltar este punto
                  </button>
                </div>
              ) : (
                <div className="mt-6 animate-rise space-y-4">
                  <div className="rounded-xl bg-bad-soft px-3.5 py-2.5">
                    <p className="text-[12.5px] font-semibold text-bad">
                      ¿Qué hay que hacer para arreglarlo?
                    </p>
                  </div>

                  <Field label="Patrón de acción" hint="Esto crea una alarma en Pendientes">
                    <textarea
                      autoFocus
                      rows={2}
                      value={patron}
                      onChange={(e) => setPatron(e.target.value)}
                      placeholder="Ej: Reparar la tapa del váter"
                      className="field-input resize-none"
                    />
                  </Field>

                  <Field label="Notas (opcional)">
                    <input
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Detalle de lo que has visto"
                      className="field-input"
                    />
                  </Field>

                  <div className="flex items-center gap-2">
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
                    <Button variant="soft" size="sm" onClick={() => fileRef.current?.click()} disabled={subiendo}>
                      {subiendo ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                      {subiendo ? "Subiendo…" : foto ? "Cambiar foto" : "Añadir foto"}
                    </Button>
                    {foto && (
                      <a href={foto} target="_blank" rel="noreferrer" className="h-9 w-9 overflow-hidden rounded-lg border border-line">
                        <img src={foto} alt="" className="h-full w-full object-cover" />
                      </a>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1" onClick={guardarFallo}>
                      Guardar y continuar
                    </Button>
                    <Button variant="ghost" onClick={() => setFase("pregunta")}>
                      Atrás
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pie */}
      {!terminado && (
        <div className="shrink-0 border-t border-line bg-surface px-4 py-2.5">
          <div className="mx-auto flex max-w-lg items-center justify-between">
            <button
              onClick={() => setI((x) => Math.max(0, x - 1))}
              disabled={i === 0}
              className="text-[13px] font-medium text-ink-3 disabled:opacity-40"
            >
              ← Anterior
            </button>
            <span className="text-[11.5px] text-ink-3">se guarda solo</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Ficha de un punto --------------------------------
function DetallePunto({ tarea, verificaciones, onClose }) {
  const db = useDb();
  const { toast } = useToast();
  const [subiendo, setSubiendo] = useState(false);
  const fileRef = useRef(null);
  const [frecuencia, setFrecuencia] = useState(tarea.frecuencia);

  const historial = verificaciones
    .filter((v) => v.tarea_id === tarea.id)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 8);

  const subir = async (file) => {
    if (!file) return;
    setSubiendo(true);
    try {
      await registrarVerificacion(tarea.id, {
        funciona: tarea.funciona !== false,
        no_aplica: tarea.no_aplica,
        notas: tarea.notas,
        patron_accion: tarea.patron_accion,
        responsable: tarea.responsable,
        foto_url: await subirFoto(file),
      });
      toast("Foto guardada", "ok");
    } catch (e) {
      toast(`No se pudo subir: ${e.message}`, "error", 4000);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={tarea.no_aplica ? "neutral" : tarea.estado !== "completada" ? "warn" : tarea.funciona === false ? "bad" : "ok"}>
            {tarea.no_aplica
              ? "No aplica"
              : tarea.estado !== "completada"
              ? "Pendiente"
              : tarea.funciona === false
              ? "No funciona"
              : "Correcto"}
          </Pill>
          {tarea.accion_abierta && <Pill tone="warn" dot>Acción abierta</Pill>}
        </div>
        <p className="mt-2 text-[15px] font-bold text-ink">{tarea.nombre}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{tarea.observacion}</p>
      </div>

      <div className="grid gap-1.5 rounded-xl bg-canvas p-3 text-[12.5px]">
        <div className="flex justify-between gap-3">
          <span className="text-ink-3">Última comprobación</span>
          <span className="font-medium text-ink">
            {tarea.fecha ? `${fechaCorta(tarea.fecha)} ${tarea.hora || ""}` : "Nunca"}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-ink-3">Quién</span>
          <span className="font-medium text-ink">{tarea.responsable || "—"}</span>
        </div>
        {tarea.notas && (
          <div className="flex justify-between gap-3">
            <span className="text-ink-3">Notas</span>
            <span className="text-right text-ink">{tarea.notas}</span>
          </div>
        )}
        {tarea.accion_abierta && (
          <div className="mt-1 rounded-lg bg-warn-soft px-2.5 py-1.5 text-warn">
            <strong>Acción:</strong> {tarea.accion}
          </div>
        )}
      </div>

      <Field label="Frecuencia">
        <select
          value={frecuencia}
          onChange={(e) => {
            setFrecuencia(e.target.value);
            actualizarTarea(tarea.id, { frecuencia: e.target.value });
          }}
          className="field-input py-2 text-[13px]"
        >
          {FRECUENCIAS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
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
        <Button variant="soft" size="sm" onClick={() => fileRef.current?.click()} disabled={subiendo}>
          {subiendo ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          {subiendo ? "Subiendo…" : tarea.foto_url ? "Cambiar foto" : "Añadir foto"}
        </Button>
        {tarea.foto_url && (
          <a href={tarea.foto_url} target="_blank" rel="noreferrer" className="h-9 w-9 overflow-hidden rounded-lg border border-line">
            <img src={tarea.foto_url} alt="" className="h-full w-full object-cover" />
          </a>
        )}
        <button
          onClick={() => {
            volverAPendiente(tarea.id);
            toast("Punto marcado como pendiente", "info");
            onClose();
          }}
          className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-ink-3 transition hover:text-ink"
        >
          <RotateCcw size={13} /> Volver a pendiente
        </button>
      </div>

      {historial.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-3">
            Historial de este punto
          </p>
          <ul className="space-y-1">
            {historial.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg bg-canvas px-2.5 py-1.5 text-[11.5px]">
                <span className="text-ink-2">
                  {fechaHora(v.fecha)} · {v.responsable || "—"}
                </span>
                <Pill tone={v.tipo === "resolucion" ? "ok" : v.no_aplica ? "neutral" : v.funciona === false ? "bad" : "ok"}>
                  {v.tipo === "resolucion" ? "Resuelto" : v.no_aplica ? "No aplica" : v.funciona === false ? "Fallo" : "OK"}
                </Pill>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Página -------------------------------------------
export default function Prevencion() {
  const db = useDb();
  const { perfil } = useSession();
  const [params, setParams] = useSearchParams();
  const [vista, setVista] = useState("pendientes");
  const [q, setQ] = useState("");
  const [nueva, setNueva] = useState("");
  const [repaso, setRepaso] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const { toast } = useToast();

  const param = params.get("apto");
  const apto =
    db.apartamentos.find((a) => a.slug === param || a.id === param) || db.apartamentos[0] || null;
  const aptoId = apto?.id;
  const idx = db.apartamentos.findIndex((a) => a.id === aptoId);

  useEffect(() => {
    if (!param && apto) setParams({ apto: apto.slug || apto.id }, { replace: true });
  }, [param, apto, setParams]);

  const info = apto ? resumenApartamento(apto.id) : null;
  const tareas = db.tareas.filter((t) => t.apartamento_id === aptoId);
  const occ = apto ? ocupacion(apto.id) : { activa: null };

  const visibles = useMemo(() => {
    const term = q.trim().toLowerCase();
    return tareas.filter((t) => {
      if (vista === "pendientes" && t.no_aplica) return false;
      if (vista === "pendientes" && t.estado === "completada") return false;
      if (vista === "hechos" && t.estado !== "completada") return false;
      if (vista === "noaplica" && !t.no_aplica) return false;
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
      if (!t.no_aplica) m[k].total += 1;
      if (t.estado === "completada" && !t.no_aplica) m[k].hechas += 1;
    }
    return m;
  }, [tareas]);

  const pendientes = tareas.filter((t) => !t.no_aplica && t.estado !== "completada");
  const hechos = tareas.filter((t) => t.estado === "completada" && !t.no_aplica);
  const noAplica = tareas.filter((t) => t.no_aplica);

  const empezar = () => {
    const base = pendientes.length > 0 ? pendientes : tareas.filter((t) => !t.no_aplica);
    setRepaso(base.map((t) => t.id));
  };

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

  if (!apto || !info) return null;

  const detalleTarea = detalle ? db.tareas.find((t) => t.id === detalle) : null;

  return (
    <div className="space-y-3.5">
      {repaso && (
        <ModoRepaso ids={repaso} perfil={perfil} onCerrar={() => setRepaso(null)} />
      )}

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
          <IconButton label="Siguiente" onClick={() => mover(1)} disabled={idx >= db.apartamentos.length - 1}>
            <ChevronRight size={17} className={idx >= db.apartamentos.length - 1 ? "opacity-30" : ""} />
          </IconButton>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-4">
          <Ring value={info.progreso} size={58} stroke={6} tone={info.progreso === 100 ? "ok" : "accent"} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-bold tracking-tight text-ink">{apto.nombre}</h2>
              <Pill tone={occ.activa ? "ok" : "neutral"} dot>
                {occ.activa ? "Ocupado" : "Libre"}
              </Pill>
              {info.acciones > 0 && (
                <Pill tone="warn" dot>
                  {plural(info.acciones, "acción abierta", "acciones abiertas")}
                </Pill>
              )}
            </div>
            <p className="mt-1 text-[12.5px] text-ink-3">
              {info.hechas} de {info.aplicables} puntos
              {info.noAplica > 0 ? ` · ${info.noAplica} no aplica` : ""}
            </p>
          </div>
        </div>
        <div className="px-4 pb-3">
          <Progress value={info.progreso} tone={info.progreso === 100 ? "ok" : "accent"} />
        </div>
        <div className="border-t border-line p-3">
          <Button className="w-full" size="lg" onClick={empezar}>
            <ShieldCheck size={18} />
            {pendientes.length > 0
              ? `Repasar ${plural(pendientes.length, "punto", "puntos")}`
              : "Repasar los 31 puntos"}
          </Button>
        </div>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="no-scrollbar overflow-x-auto">
          <Segmented
            value={vista}
            onChange={setVista}
            options={[
              { value: "pendientes", label: "Pendientes", count: pendientes.length },
              { value: "todos", label: "Todos", count: tareas.length },
              { value: "hechos", label: "Hechos", count: hechos.length },
              ...(noAplica.length ? [{ value: "noaplica", label: "No aplica", count: noAplica.length }] : []),
            ]}
          />
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
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
            title={vista === "pendientes" ? "Todo al día" : "Nada que mostrar"}
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
                <h3 className="text-[11px] font-bold uppercase tracking-[0.09em] text-ink-3">{g.label}</h3>
                <span className="text-[11px] font-medium tabular-nums text-ink-3">
                  {totalesGrupo[g.key]?.hechas ?? 0}/{totalesGrupo[g.key]?.total ?? g.items.length}
                </span>
              </div>
              <div className="divide-y divide-line/70">
                {g.items.map((t) => {
                  const ok = t.estado === "completada" && !t.no_aplica && t.funciona !== false;
                  const fallo = t.accion_abierta;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setDetalle(t.id)}
                      className={cx(
                        "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-canvas/60 sm:px-4",
                        t.no_aplica && "opacity-60"
                      )}
                    >
                      <span
                        className={cx(
                          "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2",
                          ok && "border-ok bg-ok text-white",
                          fallo && "border-bad bg-bad text-white",
                          t.no_aplica && "border-line bg-canvas text-ink-3",
                          !ok && !fallo && !t.no_aplica && "border-line bg-white text-transparent"
                        )}
                      >
                        {t.no_aplica ? <Minus size={13} strokeWidth={3} /> : <Check size={13} strokeWidth={3} />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span
                            className={cx(
                              "truncate text-[13.5px] font-semibold",
                              t.no_aplica ? "text-ink-3 line-through" : "text-ink"
                            )}
                          >
                            {t.nombre}
                          </span>
                          {fallo && <Pill tone="bad">Acción</Pill>}
                          {t.extra && <Pill tone="accent">Extra</Pill>}
                        </span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">
                          {t.no_aplica
                            ? "No aplica en este piso"
                            : t.estado === "completada"
                            ? `${fechaCorta(t.fecha)}${t.responsable ? ` · ${t.responsable}` : ""}${
                                t.notas ? ` · ${t.notas}` : ""
                              }`
                            : t.observacion}
                        </span>
                      </span>

                      <ChevronRight size={15} className="shrink-0 text-ink-3" />
                    </button>
                  );
                })}
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
          placeholder={`Añadir tarea extra a ${apto.nombre}…`}
          className="h-9 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-3"
        />
        <Button size="sm" variant="outline" onClick={anadir} disabled={!nueva.trim()}>
          Añadir
        </Button>
      </Card>

      <Sheet open={Boolean(detalleTarea)} onClose={() => setDetalle(null)} title="Detalle del punto">
        {detalleTarea && (
          <DetallePunto
            tarea={detalleTarea}
            verificaciones={db.verificaciones || []}
            onClose={() => setDetalle(null)}
          />
        )}
      </Sheet>
    </div>
  );
}
