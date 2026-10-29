// ============================================================
// Nuba Ops — Incidencias (con importación ICNEA .csv)
// ============================================================

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Euro,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Wrench,
  Upload,
} from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { useToast } from "../context/ToastContext.jsx";
import {
  actualizarIncidencia,
  crearIncidencia,
  ocupacion,
  reabrirIncidencia,
  resolverIncidencia,
  subirFoto,
} from "../lib/api.js";
import { RESPONSABLES, URGENCIAS, urgencia } from "../lib/seed.js";
import { Button, Card, EmptyState, Field, Pill, Segmented, Sheet, cx } from "../components/ui.jsx";
import { diasDesde, euros, fechaHora, hace, horasHasta } from "../lib/format.js";

const vacio = {
  apartamento_id: "",
  descripcion: "",
  urgencia: "media",
  responsable: "",
  patron_accion: "",
  alerta_horas: 48,
  foto_url: null,
};

function BotonFoto({ valor, onChange, label = "Añadir foto" }) {
  const [subiendo, setSubiendo] = useState(false);
  const { toast } = useToast();
  const id = `foto-${Math.random().toString(36).slice(2, 8)}`;

  const subir = async (file) => {
    if (!file) return;
    setSubiendo(true);
    try {
      const url = await subirFoto(file);
      onChange(url);
      toast("Foto lista", "ok");
    } catch (e) {
      toast(`No se pudo subir la foto: ${e.message}`, "error", 4000);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="flex items-center gap-2.5">
      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-[12.5px] font-semibold text-accent-ink transition hover:bg-[#d6f2f6]"
      >
        {subiendo ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
        {subiendo ? "Subiendo…" : valor ? "Cambiar foto" : label}
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          subir(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {valor && (
        <>
          <a
            href={valor}
            target="_blank"
            rel="noreferrer"
            className="h-10 w-10 overflow-hidden rounded-lg border border-line"
          >
            <img src={valor} alt="" className="h-full w-full object-cover" />
          </a>
          <button
            onClick={() => onChange(null)}
            className="text-[12px] font-medium text-ink-3 hover:text-bad"
          >
            Quitar
          </button>
        </>
      )}
    </div>
  );
}

function FormularioIncidencia({ inicial, aptos, onGuardar, onCancelar, esEdicion }) {
  const [form, setForm] = useState({ ...vacio, ...inicial });
  const valido = form.apartamento_id && form.descripcion.trim().length > 3;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      {!esEdicion && (
        <Field label="Apartamento">
          <select
            value={form.apartamento_id}
            onChange={(e) => set("apartamento_id", e.target.value)}
            className="field-input"
          >
            <option value="">— Seleccionar —</option>
            {aptos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Qué pasa">
        <textarea
          rows={3}
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          placeholder="Ej: fuga de agua bajo el fregadero de la cocina"
          className="field-input resize-none"
        />
      </Field>

      <Field label="Urgencia">
        <div className="grid grid-cols-3 gap-2">
          {URGENCIAS.map((u) => (
            <button
              key={u.value}
              onClick={() => set("urgencia", u.value)}
              className={cx(
                "rounded-xl border px-2 py-2 text-[13px] font-semibold transition",
                form.urgencia === u.value
                  ? `${u.chip} border-transparent`
                  : "border-line bg-white text-ink-3 hover:border-ink-3/40"
              )}
            >
              <span className={cx("mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle", u.dot)} />
              {u.label}
            </button>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Responsable">
          <select
            value={form.responsable}
            onChange={(e) => set("responsable", e.target.value)}
            className="field-input"
          >
            <option value="">— Sin asignar —</option>
            {RESPONSABLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Avisar antes del check-out">
          <select
            value={form.alerta_horas}
            onChange={(e) => set("alerta_horas", Number(e.target.value))}
            className="field-input"
          >
            {[24, 48, 72].map((h) => (
              <option key={h} value={h}>
                {h} horas antes
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Patrón de acción" hint="Qué hay que hacer para resolverlo">
        <input
          value={form.patron_accion}
          onChange={(e) => set("patron_accion", e.target.value)}
          placeholder="Ej: llamar al fontanero de guardia"
          className="field-input"
        />
      </Field>

      <Field label="Foto de apertura">
        <BotonFoto valor={form.foto_url} onChange={(v) => set("foto_url", v)} />
      </Field>

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" disabled={!valido} onClick={() => onGuardar(form)}>
          {esEdicion ? "Guardar cambios" : "Registrar incidencia"}
        </Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function FormularioResolucion({ incidencia, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    quien_reparo: incidencia.responsable || "",
    coste: "",
    observaciones: "",
    foto_url: null,
  });

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-canvas p-3">
        <p className="text-[13px] font-semibold text-ink">{incidencia.descripcion}</p>
        <p className="mt-0.5 text-[11.5px] text-ink-3">Abierta {hace(incidencia.fecha_apertura)}</p>
      </div>

      <Field label="Quién lo ha arreglado">
        <input
          value={form.quien_reparo}
          onChange={(e) => setForm((f) => ({ ...f, quien_reparo: e.target.value }))}
          placeholder="Nombre o empresa"
          className="field-input"
        />
      </Field>

      <Field label="Coste (€)" hint="Déjalo vacío si es 0">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={form.coste}
          onChange={(e) => setForm((f) => ({ ...f, coste: e.target.value }))}
          placeholder="0"
          className="field-input"
        />
      </Field>

      <Field label="Qué se ha hecho">
        <textarea
          rows={3}
          value={form.observaciones}
          onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))}
          placeholder="Observaciones técnicas, piezas cambiadas…"
          className="field-input resize-none"
        />
      </Field>

      <Field label="Foto de cierre">
        <BotonFoto
          valor={form.foto_url}
          onChange={(v) => setForm((f) => ({ ...f, foto_url: v }))}
          label="Añadir foto de cierre"
        />
      </Field>

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" onClick={() => onGuardar(form)}>
          <CheckCircle2 size={16} /> Marcar como resuelta
        </Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function TarjetaIncidencia({ inc, apto, onEditar, onResolver, onReabrir }) {
  const u = urgencia(inc.urgencia);
  const dias = diasDesde(inc.fecha_apertura) ?? 0;
  const occ = ocupacion(inc.apartamento_id);
  const horas = occ.activa ? horasHasta(occ.activa.fecha_salida) : null;
  const alarma =
    inc.estado === "pendiente" && horas != null && horas >= 0 && horas <= (inc.alerta_horas || 48);

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <div className={cx("w-1 shrink-0", inc.estado === "resuelta" ? "bg-ok/40" : u.bar)} />
        <div className="min-w-0 flex-1 p-3.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[13.5px] font-bold tracking-tight text-ink">{apto?.nombre}</p>
            <Pill
              tone={
                inc.estado === "resuelta"
                  ? "ok"
                  : inc.urgencia === "alta"
                  ? "bad"
                  : inc.urgencia === "media"
                  ? "warn"
                  : "neutral"
              }
            >
              {inc.estado === "resuelta" ? "Resuelta" : u.label}
            </Pill>
            {inc.estado === "pendiente" && (
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-ink-3">
                <Clock size={11} />
                {dias === 0 ? "hoy" : dias === 1 ? "1 día" : `${dias} días`}
              </span>
            )}
            {inc.estado === "resuelta" && inc.coste > 0 && (
              <Pill tone="neutral">{euros(inc.coste)}</Pill>
            )}
            {alarma && (
              <Pill tone="warn" dot>
                Check-out en {Math.max(0, Math.round(horas))} h
              </Pill>
            )}
          </div>

          <p className="mt-1 text-[13px] leading-snug text-ink-2">{inc.descripcion}</p>

          {inc.estado === "pendiente" && inc.patron_accion && (
            <p className="mt-1 text-[12px] text-ink-3">→ {inc.patron_accion}</p>
          )}

          {inc.estado === "resuelta" && (
            <p className="mt-1 text-[12px] text-ink-3">
              {inc.quien_reparo ? `Reparado por ${inc.quien_reparo}` : "Reparada"}
              {inc.fecha_cierre ? ` · ${fechaHora(inc.fecha_cierre)}` : ""}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {inc.responsable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11.5px] font-medium text-ink-2">
                <Wrench size={10.5} /> {inc.responsable}
              </span>
            )}

            {inc.foto_apertura_url && (
              <a
                href={inc.foto_apertura_url}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 overflow-hidden rounded-lg border border-line"
              >
                <img src={inc.foto_apertura_url} alt="" className="h-full w-full object-cover" />
              </a>
            )}
            {inc.foto_cierre_url && (
              <a
                href={inc.foto_cierre_url}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 overflow-hidden rounded-lg border border-ok/40"
              >
                <img src={inc.foto_cierre_url} alt="" className="h-full w-full object-cover" />
              </a>
            )}

            <div className="ml-auto flex items-center gap-3">
              {inc.estado === "pendiente" ? (
                <>
                  <button
                    onClick={() => onEditar(inc)}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 transition hover:text-ink"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => onResolver(inc)}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-accent-ink transition hover:underline"
                  >
                    <CheckCircle2 size={12} /> Resolver
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onReabrir(inc)}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-3 transition hover:text-ink"
                >
                  <RotateCcw size={12} /> Reabrir
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Incidencias() {
  const db = useDb();
  const [params, setParams] = useSearchParams();
  const { toast } = useToast();
  const [vista, setVista] = useState("abiertas");
  const [sheet, setSheet] = useState(null);

  const aptoParam = params.get("apto") || "";
  const aptoFiltroId = aptoParam
    ? db.apartamentos.find((a) => a.slug === aptoParam || a.id === aptoParam)?.id || ""
    : "";
  const abiertas = db.incidencias.filter((i) => i.estado === "pendiente");
  const resueltas = db.incidencias.filter((i) => i.estado === "resuelta");

  const lista = useMemo(() => {
    const base = vista === "abiertas" ? abiertas : resueltas;
    const filtrada = aptoFiltroId ? base.filter((i) => i.apartamento_id === aptoFiltroId) : base;
    return [...filtrada].sort((a, b) => {
      if (vista === "resueltas") {
        return new Date(b.fecha_cierre || 0) - new Date(a.fecha_cierre || 0);
      }
      const o = { alta: 0, media: 1, baja: 2 };
      return o[a.urgencia] - o[b.urgencia] || diasDesde(b.fecha_apertura) - diasDesde(a.fecha_apertura);
    });
  }, [db, vista, aptoFiltroId, abiertas, resueltas]);

  const aptosConIncidencias = useMemo(() => {
    const base = vista === "abiertas" ? abiertas : resueltas;
    const ids = new Set(base.map((i) => i.apartamento_id));
    return db.apartamentos.filter((a) => ids.has(a.id));
  }, [db, abiertas, resueltas, vista]);

  const aptoDe = (id) => db.apartamentos.find((a) => a.id === id);

  // Función para importar incidencias desde un CSV de ICNEA
  const importarIcneaCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lineas = text.split("\n");
        let importadas = 0;

        lineas.forEach((linea, index) => {
          if (index === 0) return; // Omitir cabecera si la hubiera
          if (!linea.trim()) return;
          
          const columnas = linea.split(/[,;]/); // Separador por coma o punto y coma
          const textoLinea = linea.toLowerCase();

          const aptoEncontrado = db.apartamentos.find((a) =>
            textoLinea.includes(a.nombre.toLowerCase()) || textoLinea.includes(a.slug?.toLowerCase())
          );

          if (aptoEncontrado && columnas.length >= 2) {
            const descripcion = columnas[1]?.trim() || columnas[0]?.trim() || "Incidencia importada de ICNEA";
            crearIncidencia({
              apartamento_id: aptoEncontrado.id,
              descripcion: descripcion,
              urgencia: "media",
              responsable: "",
              patron_accion: "Revisar incidencia ICNEA",
              alerta_horas: 48,
              foto_url: null,
            });
            importadas++;
          }
        });

        if (importadas > 0) {
          toast(`¡Se importaron ${importadas} incidencias desde ICNEA!`, "ok");
        } else {
          toast("El archivo CSV se procesó, pero no se asignaron pisos automáticamente.", "info");
        }
      } catch (err) {
        console.error(err);
        toast("Error al leer el archivo CSV de ICNEA", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const crear = (form) => {
    const id = crearIncidencia(form);
    setSheet(null);
    toast("Incidencia registrada", "ok");
    return id;
  };

  const editar = (form) => {
    actualizarIncidencia(sheet.inc.id, {
      descripcion: form.descripcion,
      urgencia: form.urgencia,
      responsable: form.responsable,
      patron_accion: form.patron_accion,
      alerta_horas: form.alerta_horas,
      foto_apertura_url: form.foto_url,
    });
    setSheet(null);
    toast("Cambios guardados", "ok");
  };

  const resolver = (form) => {
    resolverIncidencia(sheet.inc.id, {
      quien_reparo: form.quien_reparo,
      coste: form.coste,
      observaciones: form.observaciones,
      foto_url: form.foto_url,
    });
    setSheet(null);
    toast("Incidencia resuelta", "ok");
  };

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented
          value={vista}
          onChange={setVista}
          options={[
            { value: "abiertas", label: "Abiertas", count: abiertas.length },
            { value: "resueltas", label: "Resueltas", count: resueltas.length },
          ]}
        />
        
        <div className="flex items-center gap-2">
          {/* Apartado Importar desde ICNEA (.csv) */}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-[12.5px] font-semibold text-ink-2 transition hover:bg-canvas">
            <Upload size={14} className="text-accent" />
            <span>Importar ICNEA (.csv)</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={importarIcneaCsv}
            />
          </label>

          <Button size="sm" onClick={() => setSheet({ tipo: "nueva" })}>
            <Plus size={15} /> Nueva
          </Button>
        </div>
      </div>

      {aptosConIncidencias.length > 0 && (
        <div className="no-scrollbar -mx-3.5 flex gap-1.5 overflow-x-auto px-3.5 md:mx-0 md:px-0">
          <button
            onClick={() => setParams({})}
            className={cx(
              "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
              aptoFiltroId ? "border-brand bg-brand text-white" : "border-line bg-white text-ink-2"
            )}
          >
            Todos
          </button>
          {aptosConIncidencias.map((a) => (
            <button
              key={a.id}
              onClick={() => setParams({ apto: a.slug || a.id })}
              className={cx(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                aptoFiltroId === a.id
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-ink-2 hover:border-ink-3/40"
              )}
            >
              {a.nombre}
            </button>
          ))}
        </div>
      )}

      {lista.length === 0 ? (
        <Card>
          <EmptyState
            icon={vista === "abiertas" ? CheckCircle2 : AlertTriangle}
            title={vista === "abiertas" ? "Nada abierto" : "Sin incidencias resueltas"}
            text={
              vista === "abiertas"
                ? "No hay incidencias pendientes con este filtro."
                : "Когда resuelvas una incidencia aparecerá aquí con su coste."
            }
            action={
              vista === "abiertas" ? (
                <Button size="sm" onClick={() => setSheet({ tipo: "nueva" })}>
                  <Plus size={15} /> Registrar incidencia
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {lista.map((inc) => (
            <TarjetaIncidencia
              key={inc.id}
              inc={inc}
              apto={aptoDe(inc.apartamento_id)}
              onEditar={(i) => setSheet({ tipo: "editar", inc: i })}
              onResolver={(i) => setSheet({ tipo: "resolver", inc: i })}
              onReabrir={(i) => {
                reabrirIncidencia(i.id);
                toast("Incidencia reabierta", "info");
              }}
            />
          ))}
        </div>
      )}

      {lista.length > 0 && vista === "resueltas" && (
        <Card className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-2 text-[12.5px] text-ink-2">
            <Euro size={14} className="text-ink-3" /> Total del filtro
          </span>
          <span className="text-[15px] font-bold tabular-nums text-ink">
            {euros(lista.reduce((s, i) => s + (Number(i.coste) || 0), 0))}
          </span>
        </Card>
      )}

      <Sheet open={sheet?.tipo === "nueva"} onClose={() => setSheet(null)} title="Nueva incidencia">
        <FormularioIncidencia
          inicial={{ apartamento_id: aptoFiltroId }}
          aptos={db.apartamentos}
          onGuardar={crear}
          onCancelar={() => setSheet(null)}
        />
      </Sheet>

      <Sheet open={sheet?.tipo === "editar"} onClose={() => setSheet(null)} title="Editar incidencia">
        {sheet?.inc && (
          <FormularioIncidencia
            esEdicion
            inicial={{ ...sheet.inc, foto_url: sheet.inc.foto_apertura_url }}
            aptos={db.apartamentos}
            onGuardar={editar}
            onCancelar={() => setSheet(null)}
          />
        )}
      </Sheet>

      <Sheet
        open={sheet?.tipo === "resolver"}
        onClose={() => setSheet(null)}
        title="Resolver incidencia"
      >
        {sheet?.inc && (
          <FormularioResolucion
            incidencia={sheet.inc}
            onGuardar={resolver}
            onCancelar={() => setSheet(null)}
          />
        )}
      </Sheet>
    </div>
  );
}
