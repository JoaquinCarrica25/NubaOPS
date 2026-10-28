// ============================================================
// Nuba Ops — Pantalla "¿quién eres?"
// ============================================================

import { useState } from "react";
import { ArrowRight, ShieldCheck, AlertTriangle, CalendarDays } from "lucide-react";
import { useSession } from "../context/SessionContext.jsx";
import { iniciales } from "../lib/format.js";

const PUNTOS = [
  { icon: ShieldCheck, texto: "Checklist de 31 puntos en cada apartamento" },
  { icon: AlertTriangle, texto: "Incidencias con foto, urgencia y coste" },
  { icon: CalendarDays, texto: "Ocupación y check-outs a la vista" },
];

export default function PerfilGate() {
  const { perfiles, setPerfil } = useSession();
  const [elegido, setElegido] = useState(null);

  const entrar = (nombre) => {
    setElegido(nombre);
    setTimeout(() => setPerfil(nombre), 180);
  };

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <div className="relative flex flex-col justify-between overflow-hidden bg-brand px-7 py-8 md:w-[46%] md:px-12 md:py-14">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #00BCD4 0%, transparent 70%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                <path
                  d="M6 18V6l12 12V6"
                  stroke="#0F2A44"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-[17px] font-bold tracking-tight text-white">Nuba Ops</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Apartamentos</p>
            </div>
          </div>

          <h1 className="mt-10 max-w-sm text-[26px] font-bold leading-[1.2] tracking-tight text-white md:mt-14 md:text-[34px]">
            La casa, en orden.
            <span className="block text-accent">Antes de que llegue el huésped.</span>
          </h1>

          <ul className="mt-7 hidden space-y-3.5 md:block">
            {PUNTOS.map(({ icon: Icono, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-[13.5px] text-white/60">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.07]">
                  <Icono size={14} className="text-accent" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative mt-10 text-[11px] text-white/25 md:mt-0">
          Nuba Apartamentos · Madrid
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-surface px-5 py-10 md:px-10">
        <div className="w-full max-w-[360px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
            Acceso al panel
          </p>
          <h2 className="mt-2 text-[22px] font-bold tracking-tight text-ink">¿Quién eres hoy?</h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
            Elige tu nombre. La sesión se recuerda en este dispositivo.
          </p>

          <div className="mt-7 space-y-2">
            {perfiles.map((nombre) => {
              const activo = elegido === nombre;
              return (
                <button
                  key={nombre}
                  onClick={() => entrar(nombre)}
                  disabled={Boolean(elegido)}
                  className={`group flex w-full items-center gap-3 rounded-xl2 border px-3.5 py-3 text-left transition-all duration-150 ${
                    activo
                      ? "border-accent bg-accent-soft"
                      : "border-line bg-white hover:border-ink-3/40 hover:bg-canvas"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition-colors ${
                      activo ? "bg-accent text-ink" : "bg-brand/5 text-brand"
                    }`}
                  >
                    {iniciales(nombre)}
                  </span>
                  <span className="flex-1 text-[14.5px] font-semibold text-ink">{nombre}</span>
                  <ArrowRight
                    size={16}
                    className={`shrink-0 transition-all ${
                      activo ? "text-accent-ink" : "text-ink-3 group-hover:translate-x-0.5"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <p className="mt-8 text-[11.5px] leading-relaxed text-ink-3">
            Sin contraseña por ahora: la app es de uso interno. Si más adelante hace falta
            protegerla, se activa el acceso con email en un paso.
          </p>
        </div>
      </div>
    </div>
  );
}
