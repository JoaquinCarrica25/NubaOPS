// ============================================================
// Nuba Ops — Avisos flotantes (toasts)
// ============================================================

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

const ToastCtx = createContext(null);
let seq = 0;

const ICONOS = {
  ok: CheckCircle2,
  error: AlertTriangle,
  info: Info,
};

const ESTILOS = {
  ok: "border-ok/25 bg-white text-ink",
  error: "border-bad/30 bg-white text-ink",
  info: "border-line bg-white text-ink",
};

const ICONO_COLOR = {
  ok: "text-ok",
  error: "text-bad",
  info: "text-accent-ink",
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const cerrar = useCallback((id) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (mensaje, tipo = "ok", ms = 2600) => {
      const id = ++seq;
      setItems((prev) => [...prev.slice(-2), { id, mensaje, tipo }]);
      setTimeout(() => cerrar(id), ms);
    },
    [cerrar]
  );

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {items.map((t) => {
          const Icono = ICONOS[t.tipo] || Info;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 shadow-float animate-rise ${ESTILOS[t.tipo]}`}
              role="status"
            >
              <Icono className={`shrink-0 ${ICONO_COLOR[t.tipo]}`} size={17} />
              <p className="flex-1 text-sm font-medium">{t.mensaje}</p>
              <button
                onClick={() => cerrar(t.id)}
                className="rounded-lg p-1 text-ink-3 transition hover:bg-canvas hover:text-ink"
                aria-label="Cerrar aviso"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
