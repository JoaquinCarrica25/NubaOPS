// ============================================================
// Nuba Ops — Historial
// ============================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardCheck,
  History as HistoryIcon,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { resumenApartamento } from "../lib/api.js";
import { Card, EmptyState, Pill, Progress, Segmented, Stat, cx } from "../components/ui.jsx";
import { diasDesde, euros, fechaHora, hace } from "../lib/format.js";

function duracion(apertura, cierre) {
  if (!apertura || !cierre) return "—";
  const h = Math.round((new Date(cierre) - new Date(apertura)) / 3600000);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  const resto = h % 24;
  return resto ? `${d} d ${resto} h` : `${d} d`;
}

export default function Historial() {
  const db = useDb();
  const [vista, setVista] = useState("comprobaciones");

  const resueltas = useMemo(
    () =>
      db.incidencias
        .filter((i) => i.estado === "resuelta")
        .sort((a, b) => new Date(b.fecha_cierre || 0) - new Date(a.fecha_cierre || 0)),
    [db]
  );

  const comprobaciones = useMemo(
    () =>
      [...(db.verificaciones || [])].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 200),
    [db]
  );

  const costeTotal = resueltas.reduce((s, i) => s + (Number(i.coste) || 0), 0);

  const revisiones = useMemo(
    () =>
      db.apartamentos
        .map((a) => {
          const r = resumenApartamento(a.id);
          const tareas = db.tareas.filter((t) => t.apartamento_id === a.id && t.fecha);
          const ultima = tareas.sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)))[0]
            ?.fecha;
          return { apto: a, ...r, ultima, dias: diasDesde(ultima) };
        })
        .sort((a, b) => (b.dias ?? 999) - (a.dias ?? 999)),
    [db]
  );

  const conChecklist = revisiones.filter((r) => r.tieneChecklist);
  const aptoDe = (id) => db.apartamentos.find((a) => a.id === id);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <Stat label="Comprobaciones" value={comprobaciones.length} icon={ClipboardCheck} />
        <Stat label="Reparaciones" value={resueltas.length} icon={CheckCircle2} />
        <Stat label="Coste total" value={euros(costeTotal)} icon={Wallet} />
      </div>

      <div className="no-scrollbar overflow-x-auto">
        <Segmented
          value={vista}
          onChange={setVista}
          options={[
            { value: "comprobaciones", label: "Comprobaciones", count: comprobaciones.length },
            { value: "reparaciones", label: "Reparaciones", count: resueltas.length },
            { value: "revisiones", label: "Estado de revisión" },
          ]}
        />
      </div>

      {vista === "comprobaciones" && (
        <Card className="overflow-hidden">
          {comprobaciones.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Aún no hay comprobaciones"
              text="Cada vez que repases un piso, aquí queda quién lo hizo, cuándo y con qué resultado."
            />
          ) : (
            <ul className="divide-y divide-line">
              {comprobaciones.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={cx(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                      v.tipo === "resolucion"
                        ? "bg-ok-soft text-ok"
                        : v.no_aplica
                        ? "bg-canvas text-ink-3"
                        : v.funciona === false
                        ? "bg-bad-soft text-bad"
                        : "bg-ok-soft text-ok"
                    )}
                  >
                    {v.tipo === "resolucion" ? <CheckCircle2 size={14} /> : <ClipboardCheck size={14} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2">
                      <p className="truncate text-[13px] font-semibold text-ink">
                        {aptoDe(v.apartamento_id)?.nombre}
                      </p>
                      <span className="truncate text-[12px] text-ink-2">{v.nombre}</span>
                    </div>
                    <p className="text-[11px] text-ink-3">
                      {fechaHora(v.fecha)} · {v.responsable || "—"}
                      {v.notas ? ` · ${v.notas}` : ""}
                    </p>
                    {v.tipo === "resolucion" && v.notas && (
                      <p className="text-[11px] text-ok">Resuelto: {v.notas}</p>
                    )}
                  </div>
                  <Pill
                    tone={
                      v.tipo === "resolucion"
                        ? "ok"
                        : v.no_aplica
                        ? "neutral"
                        : v.funciona === false
                        ? "bad"
                        : "ok"
                    }
                  >
                    {v.tipo === "resolucion"
                      ? "Resuelto"
                      : v.no_aplica
                      ? "No aplica"
                      : v.funciona === false
                      ? "Fallo"
                      : "OK"}
                  </Pill>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {vista === "reparaciones" && (
        <>
          {resueltas.length === 0 ? (
            <Card>
              <EmptyState
                icon={HistoryIcon}
                title="Aún no hay reparaciones cerradas"
                text="Cuando resuelvas una incidencia aparecerá aquí con su coste."
              />
            </Card>
          ) : (
            <div className="space-y-2.5">
              {resueltas.map((i) => {
                const apto = aptoDe(i.apartamento_id);
                return (
                  <Card key={i.id} className="p-3.5">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="text-[13.5px] font-bold tracking-tight text-ink">{apto?.nombre}</p>
                      <Pill tone="ok">Resuelta</Pill>
                      <span className="text-[11.5px] text-ink-3">
                        {duracion(i.fecha_apertura, i.fecha_cierre)}
                      </span>
                      {i.coste > 0 && <Pill tone="neutral">{euros(i.coste)}</Pill>}
                    </div>
                    <p className="mt-1 text-[13px] text-ink-2">{i.descripcion}</p>
                    <p className="mt-1 text-[11.5px] text-ink-3">
                      {i.quien_reparo ? `Hecho por ${i.quien_reparo}` : "Sin técnico"} ·{" "}
                      {fechaHora(i.fecha_cierre)}
                    </p>
                    {i.observaciones && (
                      <p className="mt-1.5 rounded-lg bg-canvas px-2.5 py-1.5 text-[12px] italic text-ink-2">
                        {i.observaciones}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      {i.foto_apertura_url && (
                        <a
                          href={i.foto_apertura_url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-10 w-10 overflow-hidden rounded-lg border border-line"
                        >
                          <img src={i.foto_apertura_url} alt="Antes" className="h-full w-full object-cover" />
                        </a>
                      )}
                      {i.foto_cierre_url && (
                        <a
                          href={i.foto_cierre_url}
                          target="_blank"
                          rel="noreferrer"
                          className="h-10 w-10 overflow-hidden rounded-lg border border-ok/40"
                        >
                          <img src={i.foto_cierre_url} alt="Después" className="h-full w-full object-cover" />
                        </a>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {vista === "revisiones" && (
        <Card className="overflow-hidden">
          <div className="border-b border-line px-4 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-ink-3">
              De menos a más revisado
            </p>
          </div>
          <ul className="divide-y divide-line">
            {revisiones.map(
              ({ apto, progreso, tieneChecklist, hechas, aplicables, ultima, dias }) => (
                <li key={apto.id}>
                  <Link
                    to={`/prevencion?apto=${apto.slug || apto.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-canvas/60"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[13px] font-semibold text-ink">{apto.nombre}</p>
                        {dias != null && dias > 30 && <Pill tone="warn">+30 d</Pill>}
                      </div>
                      <p className="text-[11.5px] text-ink-3">
                        {!tieneChecklist
                          ? "Sin checklist asignado"
                          : `${ultima ? `Última revisión ${hace(ultima)}` : "Sin revisar"} · ${hechas}/${aplicables}`}
                      </p>
                    </div>
                    {tieneChecklist && (
                      <>
                        <div className="w-20 shrink-0">
                          <Progress
                            value={progreso}
                            tone={progreso === 100 ? "ok" : progreso < 40 ? "warn" : "accent"}
                          />
                        </div>
                        <span
                          className={cx(
                            "w-9 shrink-0 text-right text-[11.5px] font-bold tabular-nums",
                            progreso === 100 ? "text-ok" : "text-ink-2"
                          )}
                        >
                          {progreso}%
                        </span>
                      </>
                    )}
                  </Link>
                </li>
              )
            )}
          </ul>
        </Card>
      )}
    </div>
  );
}
