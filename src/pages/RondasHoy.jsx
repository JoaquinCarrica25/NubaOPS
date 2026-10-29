// ============================================================
// Nuba Ops — Rondas de Hoy (Agenda de comprobaciones del día)
// ============================================================

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, ArrowUp, ArrowDown, X, Pencil, Plus, ShieldCheck } from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { useToast } from "../context/ToastContext.jsx";
import { Card, Pill, Button, Field, Sheet, cx } from "../components/ui.jsx";
import { fechaCorta, plural } from "../lib/format.js";

export default function RondasHoy() {
  const db = useDb();
  const { toast } = useToast();
  const [sheet, setSheet] = useState(false);
  const [editando, setEditando] = useState(null);

  // Filtrar reservas que terminan hoy
  const hoyStr = new Date().toDateString();
  const checkoutsHoy = useMemo(() => {
    return db.reservas.filter((r) => {
      const salidaDate = new Date(r.fecha_salida);
      return salidaDate.toDateString() === hoyStr;
    });
  }, [db.reservas, hoyStr]);

  // Estado local para permitir ordenar los pisos a gusto y eliminar/ocultar elementos de la lista de hoy
  const [ordenPersonalizado, setOrdenPersonalizado] = useState(null);

  const listaPisos = useMemo(() => {
    // Si hay check-outs hoy, los listamos. Si no, mostramos todos los apartamentos para pruebas o agenda flexible.
    const base = checkoutsHoy.length > 0 
      ? checkoutsHoy.map(r => ({
          id: r.id,
          aptoId: r.apartamento_id,
          tipo: "Check-out",
          detalle: `Salida de ${r.notas || 'Huésped'} (${r.huespedes} pax)`,
          fechaSalida: r.fecha_salida
        }))
      : db.apartamentos.map(a => ({
          id: a.id,
          aptoId: a.id,
          tipo: "Revisión general",
          detalle: "Sin salida programada hoy",
          fechaSalida: new Date().toISOString()
        }));

    if (ordenPersonalizado) {
      return [...base].sort((a, b) => {
        const ia = ordenPersonalizado.indexOf(a.id);
        const ib = ordenPersonalizado.indexOf(b.id);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      });
    }
    return base;
  }, [checkoutsHoy, db.apartamentos, ordenPersonalizado]);

  const moverItem = (index, direccion) => {
    const nuevaLista = [...listaPisos];
    const destino = index + direccion;
    if (destino < 0 || destino >= nuevaLista.length) return;
    
    const temp = nuevaLista[index];
    nuevaLista[index] = nuevaLista[destino];
    nuevaLista[destino] = temp;

    setOrdenPersonalizado(nuevaLista.map(item => item.id));
    toast("Orden actualizado", "ok");
  };

  const eliminarDeRonda = (id) => {
    setOrdenPersonalizado(listaPisos.filter(item => item.id !== id).map(item => item.id));
    toast("Piso quitado de la ronda de hoy", "info");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[19px] font-bold tracking-tight text-ink">Rondas de Hoy</h1>
          <p className="text-[12.5px] text-ink-3">
            Pisos que se liberan hoy y requieren comprobación y orden de repaso.
          </p>
        </div>
        <Pill tone="accent" dot>
          {listaPisos.length} {plural(listaPisos.length, "piso en ronda", "pisos en ronda")}
        </Pill>
      </div>

      {listaPisos.length === 0 ? (
        <Card className="p-8 text-center">
          <ClipboardCheck size={32} className="mx-auto text-ink-3 mb-2" />
          <p className="text-sm font-semibold text-ink">No hay rondas programadas para hoy</p>
          <p className="text-[12px] text-ink-3 mt-1">Todos los apartamentos están libres de salidas por el momento.</p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {listaPisos.map((item, index) => {
            const apto = db.apartamentos.find(a => a.id === item.aptoId);
            if (!apto) return null;

            return (
              <Card key={item.id} className="p-3.5 flex items-center gap-3 transition hover:border-ink-3/40">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moverItem(index, -1)}
                    disabled={index === 0}
                    className="h-6 w-6 rounded bg-canvas flex items-center justify-center text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Subir"
                  >
                    <ArrowUp size={12} />
                  </button>
                  <button
                    onClick={() => moverItem(index, 1)}
                    disabled={index === listaPisos.length - 1}
                    className="h-6 w-6 rounded bg-canvas flex items-center justify-center text-ink-3 hover:text-ink disabled:opacity-30"
                    title="Bajar"
                  >
                    <ArrowDown size={12} />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-bold text-ink">{apto.nombre}</p>
                    <Pill tone="warn">{item.tipo}</Pill>
                  </div>
                  <p className="text-[12px] text-ink-3 mt-0.5">{item.detalle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/prevencion?apto=${apto.slug || apto.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-brand-2"
                  >
                    <ShieldCheck size={14} /> Repasar
                  </Link>
                  
                  <button
                    onClick={() => eliminarDeRonda(item.id)}
                    className="h-9 w-9 rounded-xl border border-line bg-white flex items-center justify-center text-ink-3 hover:text-bad hover:border-bad/40 transition"
                    title="Quitar de la lista de hoy"
                  >
                    <X size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
