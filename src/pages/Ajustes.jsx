// ============================================================
// Nuba Ops — Ajustes
// ============================================================

import { Database, Minus, Plus, Users, Wifi } from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { useSession } from "../context/SessionContext.jsx";
import { MODO, actualizarApartamento } from "../lib/api.js";
import { Card, Pill } from "../components/ui.jsx";

export default function Ajustes() {
  const db = useDb();
  const { perfil, perfiles } = useSession();

  const capacidad = (a, delta) => {
    const valor = Math.max(1, Math.min(12, (a.capacidad || 2) + delta));
    actualizarApartamento(a.id, { capacidad: valor });
  };

  return (
    <div className="space-y-3.5">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ok-soft text-ok">
            <Wifi size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[14px] font-bold tracking-tight text-ink">Conexión</p>
              <Pill tone={MODO === "supabase" ? "ok" : "warn"} dot>
                {MODO === "supabase" ? "Supabase conectado" : "Modo demo"}
              </Pill>
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
              Los datos se guardan en el proyecto de Supabase y los comparte todo el equipo.
            </p>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Users size={15} className="text-ink-3" />
          <h2 className="text-[13.5px] font-bold tracking-tight text-ink">Equipo</h2>
        </div>
        <ul className="divide-y divide-line">
          {perfiles.map((p) => (
            <li key={p} className="flex items-center gap-2.5 px-4 py-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/5 text-[11px] font-bold text-brand">
                {p.slice(0, 1).toUpperCase()}
              </span>
              <span className="flex-1 text-[13px] font-medium text-ink">{p}</span>
              {p === perfil && <Pill tone="accent">Tú</Pill>}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <Database size={15} className="text-ink-3" />
            <h2 className="text-[13.5px] font-bold tracking-tight text-ink">Capacidad por piso</h2>
          </div>
          <span className="text-[11.5px] text-ink-3">{db.apartamentos.length} pisos</span>
        </div>
        <ul className="max-h-[380px] divide-y divide-line overflow-y-auto scroll-slim">
          {db.apartamentos.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-2">
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">
                {a.nombre}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => capacidad(a, -1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink-2 transition hover:bg-canvas active:scale-95"
                  aria-label={`Quitar huésped a ${a.nombre}`}
                >
                  <Minus size={13} />
                </button>
                <span className="w-7 text-center text-[13px] font-bold tabular-nums text-ink">
                  {a.capacidad || 2}
                </span>
                <button
                  onClick={() => capacidad(a, 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-ink-2 transition hover:bg-canvas active:scale-95"
                  aria-label={`Añadir huésped a ${a.nombre}`}
                >
                  <Plus size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
