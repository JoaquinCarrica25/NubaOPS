// ============================================================
// Nuba Ops — Calendario de ocupación (con reservas editables)
// ============================================================

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { useToast } from "../context/ToastContext.jsx";
import { crearReserva, actualizarReserva, eliminarReserva } from "../lib/api.js";
import { Button, Card, Field, IconButton, Pill, Sheet, cx } from "../components/ui.jsx";
import { fechaHora, plural } from "../lib/format.js";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

const p2 = (n) => String(n).padStart(2, "0");

function aInput(iso) {
  const d = iso ? new Date(iso) : new Date();
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

function FormularioReserva({ inicial, aptos, onGuardar, onCancelar }) {
  const [form, setForm] = useState({
    apartamento_id: inicial?.apartamento_id || aptos[0]?.id || "",
    entrada: aInput(inicial?.fecha_entrada || Date.now()),
    salida: aInput(inicial?.fecha_salida || Date.now() + 2 * 86400000),
    huespedes: inicial?.huespedes || 1,
    notas: inicial?.notas || "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const invalido = !form.apartamento_id || !form.entrada || !form.salida || form.salida <= form.entrada;

  return (
    <div className="space-y-4">
      <Field label="Apartamento">
        <select
          value={form.apartamento_id}
          onChange={(e) => set("apartamento_id", e.target.value)}
          className="field-input"
        >
          {aptos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Entrada">
          <input
            type="datetime-local"
            value={form.entrada}
            onChange={(e) => set("entrada", e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="Salida (check-out)">
          <input
            type="datetime-local"
            value={form.salida}
            onChange={(e) => set("salida", e.target.value)}
            className="field-input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Huéspedes">
          <input
            type="number"
            min={1}
            value={form.huespedes}
            onChange={(e) => set("huespedes", e.target.value)}
            className="field-input"
          />
        </Field>
        <Field label="Huésped / notas">
          <input
            value={form.notas}
            onChange={(e) => set("notas", e.target.value)}
            placeholder="Nombre o referencia"
            className="field-input"
          />
        </Field>
      </div>

      {form.salida <= form.entrada && form.salida && (
        <p className="rounded-lg bg-bad-soft px-3 py-2 text-[12px] font-medium text-bad">
          La salida tiene que ser posterior a la entrada.
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1"
          disabled={invalido}
          onClick={() =>
            onGuardar({
              apartamento_id: form.apartamento_id,
              entrada: new Date(form.entrada).toISOString(),
              salida: new Date(form.salida).toISOString(),
              huespedes: Number(form.huespedes) || 1,
              notas: form.notas,
            })
          }
        >
          Guardar reserva
        </Button>
        <Button variant="ghost" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export default function Calendario() {
  const db = useDb();
  const { toast } = useToast();
  const hoy = new Date();
  const [cursor, setCursor] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [sheet, setSheet] = useState(null);

  const año = cursor.getFullYear();
  const mes = cursor.getMonth();
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  const dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);

  const ocupadosHoy = useMemo(() => {
    const ahora = Date.now();
    return db.apartamentos.filter((a) =>
      db.reservas.some(
        (r) =>
          r.apartamento_id === a.id &&
          new Date(r.fecha_entrada).getTime() <= ahora &&
          new Date(r.fecha_salida).getTime() >= ahora
      )
    ).length;
  }, [db]);

  const reservas = useMemo(
    () =>
      db.reservas.filter((r) => {
        const ini = new Date(año, mes, 1).getTime();
        const fin = new Date(año, mes + 1, 1).getTime();
        return new Date(r.fecha_entrada).getTime() < fin && new Date(r.fecha_salida).getTime() > ini;
      }),
    [db.reservas, año, mes]
  );

  const celdas = useMemo(() => {
    const mapa = new Map();
    for (const r of reservas) {
      const ini = new Date(r.fecha_entrada);
      const fin = new Date(r.fecha_salida);
      const desde = ini.getMonth() === mes && ini.getFullYear() === año ? ini.getDate() : 1;
      const hasta = fin.getMonth() === mes && fin.getFullYear() === año ? fin.getDate() : diasEnMes;
      if (!mapa.has(r.apartamento_id)) mapa.set(r.apartamento_id, []);
      mapa.get(r.apartamento_id).push({ ...r, desde, hasta });
    }
    return mapa;
  }, [reservas, mes, año, diasEnMes]);

  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();

  const guardar = (datos) => {
    if (sheet?.modo === "editar") {
      actualizarReserva(sheet.reserva.id, {
        apartamento_id: datos.apartamento_id,
        fecha_entrada: datos.entrada,
        fecha_salida: datos.salida,
        huespedes: datos.huespedes,
        notas: datos.notas,
      });
      toast("Reserva actualizada", "ok");
    } else {
      crearReserva(datos);
      toast("Reserva añadida", "ok");
    }
    setSheet(null);
  };

  const borrar = () => {
    if (!sheet?.reserva) return;
    eliminarReserva(sheet.reserva.id);
    setSheet(null);
    toast("Reserva eliminada", "info");
  };

  const reservaActual = sheet?.reserva ? db.reservas.find((r) => r.id === sheet.reserva.id) : null;

  return (
    <div className="space-y-3.5">
      <Card className="flex items-center gap-2 px-2.5 py-2">
        <IconButton label="Mes anterior" onClick={() => setCursor(new Date(año, mes - 1, 1))}>
          <ChevronLeft size={18} />
        </IconButton>
        <div className="flex-1 text-center">
          <p className="text-[15px] font-bold capitalize tracking-tight text-ink">
            {MESES[mes]} {año}
          </p>
          <p className="text-[11.5px] text-ink-3">
            {ocupadosHoy} de {db.apartamentos.length} ocupados hoy
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setSheet({ modo: "nueva" })}>
          <Plus size={15} /> Reserva
        </Button>
        <IconButton label="Mes siguiente" onClick={() => setCursor(new Date(año, mes + 1, 1))}>
          <ChevronRight size={18} />
        </IconButton>
      </Card>

      <div className="flex flex-wrap items-center gap-4 px-1 text-[11.5px] text-ink-3">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded bg-accent" /> Ocupado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded bg-accent/40" /> Empieza o acaba fuera del mes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-4 rounded bg-canvas ring-1 ring-line" /> Libre
        </span>
      </div>

      <Card className="overflow-hidden">
        <div className="scroll-slim overflow-x-auto">
          <table
            className="border-separate border-spacing-0"
            style={{ minWidth: `${128 + diasEnMes * 30}px` }}
          >
            <thead>
              <tr>
                <th className="sticky left-0 z-20 w-[128px] border-b border-line bg-surface px-3 py-2 text-left text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-3">
                  Piso
                </th>
                {dias.map((d) => {
                  const dow = new Date(año, mes, d).getDay();
                  const finde = dow === 0 || dow === 6;
                  return (
                    <th
                      key={d}
                      className={cx(
                        "border-b border-line py-1 text-center",
                        finde && "bg-canvas/60",
                        esHoy(d) && "bg-accent-soft"
                      )}
                    >
                      <div className="text-[9px] font-semibold uppercase text-ink-3">
                        {DIAS[(dow + 6) % 7]}
                      </div>
                      <div
                        className={cx(
                          "mx-auto flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10.5px] font-bold tabular-nums",
                          esHoy(d) ? "bg-accent text-ink" : "text-ink-2"
                        )}
                      >
                        {d}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {db.apartamentos.map((a, idx) => {
                const lista = celdas.get(a.id) || [];
                return (
                  <tr key={a.id} className={idx % 2 ? "bg-canvas/30" : "bg-surface"}>
                    <td
                      className={cx(
                        "sticky left-0 z-10 border-b border-line px-3 py-1.5 text-[11.5px] font-semibold text-ink",
                        idx % 2 ? "bg-[#F8FAFC]" : "bg-surface"
                      )}
                    >
                      {a.nombre}
                    </td>
                    {dias.map((d) => {
                      const r = lista.find((x) => d >= x.desde && d <= x.hasta);
                      const inicio = r && d === r.desde;
                      const fin = r && d === r.hasta;
                      const cortada =
                        r &&
                        ((d === 1 && r.desde === 1) || (d === diasEnMes && r.hasta === diasEnMes));
                      return (
                        <td
                          key={d}
                          className={cx(
                            "relative h-7 border-b border-line p-0",
                            esHoy(d) && "bg-accent-soft/40"
                          )}
                        >
                          {r && (
                            <button
                              onClick={() => setSheet({ modo: "ver", reserva: r })}
                              className={cx(
                                "absolute inset-y-[3px] left-0 right-0 bg-accent transition hover:brightness-95",
                                inicio && "left-[2px] rounded-l-md",
                                fin && "right-[2px] rounded-r-md",
                                cortada && "opacity-50"
                              )}
                              title={r.notas}
                            >
                              {inicio && r.notas && r.hasta - r.desde >= 4 && (
                                <span className="block truncate px-1 text-left text-[9px] font-bold text-ink/80">
                                  {r.notas}
                                </span>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Sheet
        open={sheet?.modo === "ver" && Boolean(reservaActual)}
        onClose={() => setSheet(null)}
        title={db.apartamentos.find((a) => a.id === reservaActual?.apartamento_id)?.nombre || "Reserva"}
      >
        {reservaActual && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Pill tone="accent" dot>
                Reserva
              </Pill>
              <span className="text-[12px] text-ink-3">
                {plural(reservaActual.huespedes, "huésped", "huéspedes")}
              </span>
            </div>

            <div className="grid gap-2 rounded-xl bg-canvas p-3.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="text-ink-3">Entrada</span>
                <span className="font-semibold text-ink">{fechaHora(reservaActual.fecha_entrada)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-3">Salida</span>
                <span className="font-semibold text-ink">{fechaHora(reservaActual.fecha_salida)}</span>
              </div>
              {reservaActual.notas && (
                <div className="flex justify-between gap-3">
                  <span className="text-ink-3">Huésped</span>
                  <span className="text-right font-medium text-ink">{reservaActual.notas}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1"
                onClick={() => setSheet({ modo: "editar", reserva: reservaActual })}
              >
                <Pencil size={15} /> Editar
              </Button>
              <Button variant="outline" onClick={borrar} className="text-bad">
                <Trash2 size={15} /> Borrar
              </Button>
            </div>
          </div>
        )}
      </Sheet>

      <Sheet
        open={sheet?.modo === "nueva" || sheet?.modo === "editar"}
        onClose={() => setSheet(null)}
        title={sheet?.modo === "editar" ? "Editar reserva" : "Nueva reserva"}
      >
        {(sheet?.modo === "nueva" || sheet?.modo === "editar") && (
          <FormularioReserva
            inicial={sheet?.modo === "editar" ? reservaActual : null}
            aptos={db.apartamentos}
            onGuardar={guardar}
            onCancelar={() => setSheet(null)}
          />
        )}
      </Sheet>
    </div>
  );
}
