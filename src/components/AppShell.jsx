// ============================================================
// Nuba Ops — Estructura de la aplicación
// ============================================================
// Escritorio: barra lateral fija + barra superior.
// Móvil: barra superior fina + menú lateral + navegación inferior.
// ============================================================

import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  CalendarDays,
  History,
  Menu,
  X,
  LogOut,
  RotateCcw,
  Settings2,
} from "lucide-react";
import { useDb } from "../hooks/useNuba.js";
import { useSession } from "../context/SessionContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { resetDemo, MODO } from "../lib/api.js";
import { iniciales } from "../lib/format.js";
import { Sheet, cx } from "./ui.jsx";

const NAV = [
  { to: "/", label: "Inicio", icon: LayoutDashboard, end: true },
  { to: "/prevencion", label: "Prevención", icon: ShieldCheck },
  { to: "/incidencias", label: "Incidencias", icon: AlertTriangle },
  { to: "/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/historial", label: "Historial", icon: History },
];

const TITULOS = {
  "/": ["Inicio", "El estado real de la casa, de un vistazo"],
  "/prevencion": ["Prevención", "Checklist de los 31 puntos por apartamento"],
  "/incidencias": ["Incidencias", "Lo que está roto y quién lo arregla"],
  "/calendario": ["Calendario", "Ocupación y reservas"],
  "/historial": ["Historial", "Reparaciones y verificaciones cerradas"],
  "/ajustes": ["Ajustes", "Equipo, capacidad de los pisos y datos"],
};

function Logo({ compacto }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <path d="M6 18V6l12 12V6" stroke="#0F2A44" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {!compacto && (
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight text-white">Nuba</p>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.16em] text-white/40">Ops</p>
        </div>
      )}
    </div>
  );
}

function NavItems({ abiertas, onNavigate }) {
  return (
    <nav className="flex flex-col gap-0.5 px-2.5">
      {NAV.map(({ to, label, icon: Icono, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors",
              isActive ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/[0.06] hover:text-white/90"
            )
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={cx(
                  "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent transition-all",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
              <Icono size={17} strokeWidth={2} className={isActive ? "text-accent" : ""} />
              <span className="flex-1">{label}</span>
              {label === "Incidencias" && abiertas > 0 && (
                <span className="rounded-md bg-bad/90 px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums text-white">
                  {abiertas}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function EnlaceAjustes({ onNavigate }) {
  return (
    <NavLink
      to="/ajustes"
      onClick={onNavigate}
      className={({ isActive }) =>
        cx(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[12.5px] font-medium transition-colors",
          isActive ? "bg-white/10 text-white" : "text-white/45 hover:bg-white/[0.06] hover:text-white/85"
        )
      }
    >
      <Settings2 size={15} />
      Ajustes
    </NavLink>
  );
}

function Perfil({ onSalir }) {
  const { perfil } = useSession();
  return (
    <button
      onClick={onSalir}
      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition hover:bg-white/[0.06]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-[11.5px] font-bold text-accent">
        {iniciales(perfil || "?")}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-semibold text-white/90">{perfil}</span>
        <span className="block text-[10.5px] text-white/35">Cambiar de perfil</span>
      </span>
      <LogOut size={14} className="shrink-0 text-white/30" />
    </button>
  );
}

export default function AppShell() {
  const [menu, setMenu] = useState(false);
  const [ajustes, setAjustes] = useState(false);
  const { perfil, salir } = useSession();
  const { toast } = useToast();
  const db = useDb();
  const { pathname } = useLocation();

  const abiertas = db.incidencias.filter((i) => i.estado === "pendiente").length;
  const [titulo, subtitulo] = TITULOS[pathname] || ["Nuba Ops", ""];

  const reiniciar = () => {
    resetDemo();
    setAjustes(false);
    toast("Datos de prueba reiniciados", "info");
  };

  return (
    <div className="flex min-h-full bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-brand md:flex">
        <div className="px-5 pb-6 pt-6">
          <Logo />
        </div>

        <NavItems abiertas={abiertas} />

        <div className="mt-auto space-y-2 p-3">
          <div className="px-1">
            <EnlaceAjustes />
          </div>
          {MODO === "demo" && (
            <button
              onClick={() => setAjustes(true)}
              className="flex w-full items-center gap-2 rounded-xl bg-white/[0.05] px-2.5 py-2 text-left text-[11.5px] text-white/45 transition hover:bg-white/[0.09] hover:text-white/70"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-warn" />
              Modo demo · datos de prueba
            </button>
          )}
          <Perfil
            onSalir={() => {
              salir();
              setMenu(false);
            }}
          />
          {perfil && (
            <p className="px-2 pb-1 text-[10px] leading-relaxed text-white/25">
              Nuba Ops · {new Date().getFullYear()}
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-[248px]">
        <header className="sticky top-0 z-30 hidden border-b border-line bg-canvas/85 px-8 py-4 backdrop-blur-md md:block">
          <div className="mx-auto flex max-w-[1180px] items-end justify-between gap-6">
            <div>
              <h1 className="text-[19px] font-bold tracking-tight text-ink">{titulo}</h1>
              <p className="mt-0.5 text-[12.5px] text-ink-3">{subtitulo}</p>
            </div>
            <p className="pb-0.5 text-[12px] font-medium text-ink-3">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
        </header>

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-3 py-2 backdrop-blur-md md:hidden">
          <button
            onClick={() => setMenu(true)}
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-xl text-ink-2 active:bg-canvas"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <path d="M6 18V6l12 12V6" stroke="#00BCD4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-[14px] font-bold tracking-tight text-ink">Nuba Ops</span>
          </div>
          <button
            onClick={() => setMenu(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/5 text-[11px] font-bold text-brand"
            aria-label="Perfil"
          >
            {iniciales(perfil || "?")}
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-3.5 pb-28 pt-4 md:px-8 md:pb-14 md:pt-6">
          <Outlet />
        </main>
      </div>

      {menu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-brand/40 backdrop-blur-[2px] animate-pop" onClick={() => setMenu(false)} />
          <aside className="relative flex h-full w-[272px] flex-col bg-brand shadow-float animate-rise">
            <div className="flex items-center justify-between px-5 pb-5 pt-5">
              <Logo />
              <button
                onClick={() => setMenu(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50"
                aria-label="Cerrar menú"
              >
                <X size={18} />
              </button>
            </div>
            <NavItems abiertas={abiertas} onNavigate={() => setMenu(false)} />
            <div className="mt-2 px-2.5">
              <EnlaceAjustes onNavigate={() => setMenu(false)} />
            </div>
            <div className="mt-auto p-3">
              <Perfil
                onSalir={() => {
                  salir();
                  setMenu(false);
                }}
              />
            </div>
          </aside>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="flex items-stretch justify-around px-1">
          {NAV.map(({ to, label, icon: Icono, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx(
                  "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition-colors",
                  isActive ? "text-brand" : "text-ink-3"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icono size={19} strokeWidth={isActive ? 2.4 : 2} />
                    {label === "Incidencias" && abiertas > 0 && (
                      <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-bad px-1 text-[9px] font-bold text-white">
                        {abiertas}
                      </span>
                    )}
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Sheet open={ajustes} onClose={() => setAjustes(false)} title="Modo demo">
        <p className="text-sm leading-relaxed text-ink-2">
          Ahora mismo la app funciona con datos de prueba guardados en este navegador.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={reiniciar}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-ink-2 transition hover:bg-canvas"
          >
            <RotateCcw size={15} /> Reiniciar datos
          </button>
        </div>
      </Sheet>
    </div>
  );
}
