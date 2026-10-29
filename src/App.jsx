// ============================================================
// Nuba Ops — Rutas y carga inicial
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useSession } from "./context/SessionContext.jsx";
import { MODO, cargarTodo } from "./lib/api.js";
import PerfilGate from "./components/PerfilGate.jsx";
import AppShell from "./components/AppShell.jsx";
import Inicio from "./pages/Inicio.jsx";
import RondasHoy from "./pages/RondasHoy.jsx";
import Prevencion from "./pages/Prevencion.jsx";
import Pendientes from "./pages/Pendientes.jsx";
import Incidencias from "./pages/Incidencias.jsx";
import Calendario from "./pages/Calendario.jsx";
import Historial from "./pages/Historial.jsx";
import Ajustes from "./pages/Ajustes.jsx";

function Marca() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand shadow-lg">
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
        <path
          d="M6 18V6l12 12V6"
          stroke="#00BCD4"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function Cargando() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 bg-canvas">
      <Marca />
      <div className="flex items-center gap-2 text-[13px] font-medium text-ink-3">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        Cargando los datos de la casa…
      </div>
    </div>
  );
}

function ErrorCarga({ reintentar }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <Marca />
      <div>
        <p className="text-[15px] font-bold text-ink">No puedo conectar con la base de datos</p>
        <p className="mt-1 max-w-xs text-[13px] text-ink-3">
          Comprueba la conexión y vuelve a intentarlo.
        </p>
      </div>
      <button
        onClick={reintentar}
        className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white"
      >
        Reintentar
      </button>
    </div>
  );
}

export default function App() {
  const { perfil } = useSession();
  const [estado, setEstado] = useState(MODO === "supabase" ? "cargando" : "listo");

  const cargar = useCallback(() => {
    if (MODO !== "supabase") {
      setEstado("listo");
      return;
    }
    setEstado("cargando");
    cargarTodo()
      .then(() => setEstado("listo"))
      .catch((e) => {
        console.error(e);
        setEstado("error");
      });
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (estado === "cargando") return <Cargando />;
  if (estado === "error") return <ErrorCarga reintentar={cargar} />;
  if (!perfil) return <PerfilGate />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Inicio />} />
        <Route path="/rondas" element={<RondasHoy />} />
        <Route path="/prevencion" element={<Prevencion />} />
        <Route path="/pendientes" element={<Pendientes />} />
        <Route path="/incidencias" element={<Incidencias />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/ajustes" element={<Ajustes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
