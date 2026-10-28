// ============================================================
// Nuba Ops — Inicio
// ============================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Search,
  Wallet,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { useSession } from "../context/SessionContext.jsx";
import {
  resumenApartamento,
  urgenciasAbiertas,
  proximosCheckouts,
  costeMes,
  mediaPrevencion,
} from "../lib/api.js";
import { urgencia } from "../lib/seed.js";
import { Card, Pill, Ring, Stat, cx } from "../components/ui.jsx";
import { diasDesde, euros, fechaCorta, plural } from "../lib/format.js";

const FILTROS = [
  { key: "todos", label: "Todos" },
  { key: "ocupados", label: "Ocupados" },
  { key: "incidencias", label: "Con incidencias" },
  { key: "atrasados", label: "Prevención < 50%" },
];

function saludo() {
  const h = new Date().getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

export default function Inicio() {
  const db = useDb();
  const { perfil } = useSession();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const abiertas = db.incidencias.filter((i) => i.estado === "pendiente");
  const altas = abiertas.filter((i) => i.urgencia === "alta").length;
  const checkouts = proximosCheckouts(48);
  const coste = costeMes();
  const media = mediaPrevencion();

  const atencion = useMemo(
    () =>
      urgenciasAbiertas()
        .filter((i) => i.urgencia === "alta" || (diasDesde(i.fecha_apertura) ?? 0) >= 7)
        .slice(0, 4),
    [db]
  );

  const tarjetas = useMemo(() => {
    return db.apartamentos
      .map((a) => ({ apto: a, ...resumenApartamento(a.id) }))
      .filter(({ apto, ocupada, incidencias, progreso }) => {
        const q = busqueda.trim().toLowerCase();
        if (q && !apto.nombre.toLowerCase().includes(q)) return false;
        if (filtro === "ocupados") return ocupada;
        if (filtro === "incidencias") return incidencias > 0;
        if (filtro === "atrasados") return progreso < 50;
        return true;
      });
  }, [db, busqueda, filtro]);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex items-end justify-between gap-4 md:hidden">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
            {saludo()}
          </p>
          <h1 className="mt-0.5 text-[22px] font-bold leading-tight tracking-tight text-ink">
            {perfil?.split(" ")[0]}
          </h1>
        </div>
        <p className="pb-1 text-[11.5px] text-ink-3">
          {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long" })}
        </p>
      </div>

      <div className="hidden md:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
          {saludo()}, {perfil?.split(" ")[0]}
        </p>
        <h1 className="mt-1 text-[24px] font-bold tracking-tight text-ink">
          {abiertas.length === 0
            ? "No hay nada roto ahora mismo."
            : `Tienes ${plural(abiertas.length, "incidencia abierta", "incidencias abiertas")}.`}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        <Stat
          label="Abiertas"
          value={abiertas.length}
          sub={altas ? `${altas} de urgencia alta` : "sin urgencias altas"}
          icon={AlertTriangle}
          tone={altas ? "bad" : "ink"}
        />
        <Stat label="Check-outs" value={checkouts.length} sub="próximas 48 h" icon={CalendarClock} />
        <Stat
          label="Prevención"
          value={`${media}%`}
          sub="media de los pisos"
          icon={ShieldCheck}
          tone="accent"
        />
        <Stat label="Coste mes" value={euros(coste)} sub="reparaciones cerradas" icon={Wallet} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-bad-soft text-bad">
                <AlertTriangle size={13} />
              </span>
              <h2 className="text-[13.5px] font-bold tracking-tight text-ink">Requiere atención</h2>
            </div>
            <Link
              to="/incidencias"
              className="flex items-center gap-1 text-[12px] font-semibold text-accent-ink hover:underline"
            >
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>

          {atencion.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-7">
              <CheckCircle2 size={20} className="text-ok" />
              <div>
                <p className="text-sm font-semibold text-ink">Todo bajo control</p>
                <p className="text-[12.5px] text-ink-3">
                  Ninguna incidencia urgente ni abierta más de una semana.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {atencion.map((i) => {
                const apto = db.apartamentos.find((a) => a.id === i.apartamento_id);
                const u = urgencia(i.urgencia);
                const dias = diasDesde(i.fecha_apertura) ?? 0;
                return (
                  <li key={i.id}>
                    <Link
                      to={`/incidencias?apto=${apto?.slug || i.apartamento_id}`}
                      className="group flex items-center gap-3 px-4 py-3 transition hover:bg-canvas/70"
                    >
                      <span className={cx("h-2 w-2 shrink-0 rounded-full", u.dot)} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[13px] font-semibold text-ink">{apto?.nombre}</p>
                          <Pill
                            tone={i.urgencia === "alta" ? "bad" : i.urgencia === "media" ? "warn" : "ok"}
                          >
                            {u.label}
                          </Pill>
                        </div>
                        <p className="truncate text-[12.5px] text-ink-2">{i.descripcion}</p>
                      </div>
                      <span className="shrink-0 text-[11.5px] font-medium tabular-nums text-ink-3">
                        {dias === 0 ? "hoy" : `${dias} d`}
                      </span>
                      <ArrowRight
                        size={14}
                        className="shrink-0 text-ink-3 opacity-0 transition group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
              <Clock size={13} />
            </span>
            <h2 className="text-[13.5px] font-bold tracking-tight text-ink">Check-outs próximos</h2>
          </div>

          {checkouts.length === 0 ? (
            <p className="px-4 py-7 text-[12.5px] text-ink-3">
              No hay salidas en las próximas 48 horas.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {checkouts.slice(0, 4).map((r) => {
                const apto = db.apartamentos.find((a) => a.id === r.apartamento_id);
                const horas = Math.max(
                  0,
                  Math.round((new Date(r.fecha_salida).getTime() - Date.now()) / 3600000)
                );
                return (
                  <li key={r.id} className="flex items-center gap-2.5 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ink">{apto?.nombre}</p>
                      <p className="text-[11.5px] text-ink-3">
                        {fechaCorta(r.fecha_salida)} · {plural(r.huespedes, "huésped", "huéspedes")}
                      </p>
                    </div>
                    <Pill tone={horas <= 24 ? "warn" : "neutral"}>{horas} h</Pill>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[15px] font-bold tracking-tight text-ink">Apartamentos</h2>
            <span className="text-[12px] text-ink-3">
              {tarjetas.length} de {db.apartamentos.length}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
            />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar piso…"
              className="field-input h-9 py-0 pl-9 text-[13px]"
            />
          </div>
        </div>

        <div className="no-scrollbar -mx-3.5 mb-3 flex gap-1.5 overflow-x-auto px-3.5 md:mx-0 md:px-0">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={cx(
                "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                filtro === f.key
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-white text-ink-2 hover:border-ink-3/40"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 xl:grid-cols-4">
          {tarjetas.map(
            ({
              apto,
              progreso,
              tieneChecklist,
              checklistHechas,
              checklistTotal,
              incidencias,
              ocupada,
              reserva,
            }) => (
              <Link
                key={apto.id}
                to={`/prevencion?apto=${apto.slug || apto.id}`}
                className="group relative overflow-hidden rounded-xl2 border border-line bg-surface p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink-3/30 hover:shadow-card"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold leading-tight tracking-tight text-ink">
                      {apto.nombre}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={cx("h-1.5 w-1.5 rounded-full", ocupada ? "bg-ok" : "bg-line")} />
                      <p className="truncate text-[11px] text-ink-3">
                        {ocupada ? `Ocupado · sale ${fechaCorta(reserva?.fecha_salida)}` : "Libre"}
                      </p>
                    </div>
                  </div>
                  {tieneChecklist ? (
                    <Ring
                      value={progreso}
                      size={38}
                      stroke={4.5}
                      tone={progreso === 100 ? "ok" : "accent"}
                    />
                  ) : (
                    <span className="mt-0.5 rounded-md bg-canvas px-1.5 py-1 text-[9.5px] font-semibold uppercase tracking-wide text-ink-3">
                      Sin checklist
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex items-center gap-1.5">
                  {incidencias > 0 ? (
                    <Pill tone="bad" dot>
                      {incidencias}
                    </Pill>
                  ) : (
                    <Pill tone="ok">Al día</Pill>
                  )}
                  {tieneChecklist && (
                    <span className="ml-auto text-[10.5px] tabular-nums text-ink-3">
                      {checklistHechas}/{checklistTotal}
                    </span>
                  )}
                </div>
              </Link>
            )
          )}
        </div>

        {tarjetas.length === 0 && (
          <Card className="mt-2 px-4 py-10 text-center">
            <p className="text-sm font-semibold text-ink">Ningún piso coincide</p>
            <p className="mt-1 text-[12.5px] text-ink-3">Prueba con otro nombre o quita el filtro.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
