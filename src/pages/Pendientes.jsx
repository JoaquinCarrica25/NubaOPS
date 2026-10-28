// ============================================================
// Nuba Ops — Pendientes (alarmas del checklist)
// ============================================================
// Cada punto que se marca "No funciona" con un patrón de acción
// aparece aquí hasta que alguien lo resuelve.
// ============================================================

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Wrench, Camera } from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { useToast } from "../context/ToastContext.jsx";
import { pendientesAccion, resolverAccion } from "../lib/api.js";
import { Button, Card, EmptyState, Field, Pill, Sheet, cx } from "../components/ui.jsx";
import { diasDesde, hace, plural } from "../lib/format.js";

function TarjetaAccion({ tarea, apto, onResolver }) {
  const dias = tarea.accion_desde ? diasDesde(tarea.accion_desde) ?? 0 : null;

  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <div className="w-1 shrink-0 bg-bad" />
        <div className="min-w-0 flex-1 p-3.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              to={`/prevencion?apto=${apto?.slug || tarea.apartamento_id}`}
              className="text-[13.5px] font-bold tracking-tight text-ink hover:underline"
            >
              {apto?.nombre}
            </Link>
            <Pill tone="bad" dot>
              Acción
            </Pill>
            {dias != null && (
              <span className="text-[11.5px] font-medium text-ink-3">
                {dias === 0 ? "desde hoy" : dias === 1 ? "1 día" : `${dias} días`}
              </span>
            )}
          </div>

          <p className="mt-1 text-[12.5px] font-semibold text-ink-2">{tarea.nombre}</p>

          <div className="mt-2 rounded-xl bg-warn-soft px-3 py-2">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-warn">
              Qué hay que hacer
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-ink">{tarea.accion}</p>
          </div>

          {tarea.notas && <p className="mt-1.5 text-[12px] text-ink-3">{tarea.notas}</p>}

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {tarea.responsable && (
              <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-[11.5px] font-medium text-ink-2">
                <Wrench size={10.5} /> lo detectó {tarea.responsable}
              </span>
            )}
            {tarea.foto_url && (
              <a
                href={tarea.foto_url}
                target="_blank"
                rel="noreferrer"
                className="h-9 w-9 overflow-hidden rounded-lg border border-line"
              >
                <img src={tarea.foto_url} alt="" className="h-full w-full object-cover" />
              </a>
            )}
            <button
              onClick={() => onResolver(tarea)}
              className="ml-auto inline-flex items-center gap-1 text-[12px] font-semibold text-accent-ink transition hover:underline"
            >
              <CheckCircle2 size={13} /> Marcar resuelto
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Pendientes() {
  const db = useDb();
  const { toast } = useToast();
  const [resolviendo, setResolviendo] = useState(null);
  const [form, setForm] = useState({ quien: "", nota: "" });

  const acciones = useMemo(() => pendientesAccion(), [db]);

  const abrir = (tarea) => {
    setResolviendo(tarea);
    setForm({ quien: tarea.responsable || "", nota: "" });
  };

  const confirmar = () => {
    resolverAccion(resolviendo.id, { responsable: form.quien, nota: form.nota });
    setResolviendo(null);
    toast("Acción resuelta y guardada en el historial", "ok");
  };

  const aptoDe = (id) => db.apartamentos.find((a) => a.id === id);

  return (
    <div className="space-y-3.5">
      <div className="flex items-center gap-2.5">
        <span
          className={cx(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            acciones.length ? "bg-bad-soft text-bad" : "bg-ok-soft text-ok"
          )}
        >
          <AlertTriangle size={17} />
        </span>
        <div>
          <p className="text-[15px] font-bold tracking-tight text-ink">
            {acciones.length === 0
              ? "Nada pendiente"
              : plural(acciones.length, "acción pendiente", "acciones pendientes")}
          </p>
          <p className="text-[12px] text-ink-3">Salen del checklist al marcar "No funciona".</p>
        </div>
      </div>

      {acciones.length === 0 ? (
        <Card>
          <EmptyState
            icon={CheckCircle2}
            title="Todo resuelto"
            text="Cuando en un repaso marques algo como 'No funciona' y escribas qué hacer, aparecerá aquí."
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {acciones.map((t) => (
            <TarjetaAccion key={t.id} tarea={t} apto={aptoDe(t.apartamento_id)} onResolver={abrir} />
          ))}
        </div>
      )}

      <Sheet
        open={Boolean(resolviendo)}
        onClose={() => setResolviendo(null)}
        title="Marcar como resuelto"
      >
        {resolviendo && (
          <div className="space-y-4">
            <div className="rounded-xl bg-canvas p-3">
              <p className="text-[12.5px] font-semibold text-ink">{resolviendo.nombre}</p>
              <p className="mt-0.5 text-[12.5px] text-ink-2">{resolviendo.accion}</p>
              <p className="mt-1 text-[11px] text-ink-3">
                Abierta {hace(resolviendo.accion_desde)}
              </p>
            </div>

            <Field label="Quién lo ha resuelto">
              <input
                value={form.quien}
                onChange={(e) => setForm((f) => ({ ...f, quien: e.target.value }))}
                placeholder="Nombre"
                className="field-input"
              />
            </Field>

            <Field label="Qué se ha hecho" hint="Queda en el historial para tu jefa">
              <textarea
                rows={3}
                value={form.nota}
                onChange={(e) => setForm((f) => ({ ...f, nota: e.target.value }))}
                placeholder="Ej: se ha cambiado la tapa del váter"
                className="field-input resize-none"
              />
            </Field>

            <div className="flex gap-2 pt-1">
              <Button className="flex-1" onClick={confirmar}>
                <CheckCircle2 size={16} /> Confirmar
              </Button>
              <Button variant="ghost" onClick={() => setResolviendo(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
