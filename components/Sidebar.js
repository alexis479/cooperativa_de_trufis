"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Mountains,
  SquaresFour,
  SteeringWheel,
  Money,
  CalendarCheck,
  UserList,
  Receipt,
  WarningCircle,
  HandCoins,
  Briefcase,
  UsersThree,
  UserGear,
  ShieldCheck,
  Van,
  TrendUp,
  TrendDown,
  Scales,
  X,
  MapPinLine
} from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";
import { useMobileMenu } from "@/context/MobileMenuContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { permisos, loading } = usePermissions();
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();

  const isActive = (path) => pathname === path;

  // Si tiene permisos definidos, exigimos que "ver" sea true.
  // Si no hay permisos cargados (quizás es el admin principal o no tiene rol), por ahora lo dejamos ver todo para no bloquear el sistema.
  const canView = (moduloId) => {
    if (Object.keys(permisos).length === 0) return true;
    return permisos[moduloId]?.ver === true;
  };

  const menuOperaciones = [
    { id: "alquileres", path: "/dashboard/alquiler", icon: SteeringWheel, label: "Alquiler de Líneas" },
    { id: "aportes", path: "/dashboard/aportes", icon: Money, label: "Aportes" },
    { id: "asistencias", path: "/dashboard/asistencias", icon: CalendarCheck, label: "Asistencia Reunión" },
    { id: "choferes", path: "/dashboard/choferes", icon: UserList, label: "Choferes" },
    { id: "gastos", path: "/dashboard/gastos", icon: Receipt, label: "Gastos" },
    { id: "multas", path: "/dashboard/multas", icon: WarningCircle, label: "Multas" },
    { id: "prestamos", path: "/dashboard/prestamos", icon: HandCoins, label: "Préstamos" },
    { id: "proyectos", path: "/dashboard/proyectos", icon: Briefcase, label: "Proyectos" },
  ].filter(item => canView(item.id));

  const menuAdministracion = [
    { id: "socios", path: "/dashboard/socios", icon: UsersThree, label: "Socios" },
    { id: "usuarios", path: "/dashboard/usuarios", icon: UserGear, label: "Usuarios" },
    { id: "roles", path: "/dashboard/roles", icon: ShieldCheck, label: "Roles y Permisos" },
    { id: "vehiculos", path: "/dashboard/vehiculos", icon: Van, label: "Vehículos" },
    { id: "lineas", path: "/dashboard/lineas", icon: MapPinLine, label: "Líneas / Rutas" },
  ].filter(item => canView(item.id));

  return (
    <>
      {/* Overlay oscuro para móviles */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar contenedor */}
      <aside className={`fixed lg:static top-0 left-0 z-50 w-[260px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Mountains weight="fill" size={24} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Coop. de Transporte</h2>
          </div>
          <button 
            onClick={closeMobileMenu}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
            isActive("/dashboard")
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
          }`}
        >
          <SquaresFour size={20} />
          Dashboard
        </Link>

        {menuOperaciones.length > 0 && (
          <>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mt-4 mb-2 ml-3">
              Operaciones
            </div>
            {menuOperaciones.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  isActive(item.path)
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </>
        )}

        {menuAdministracion.length > 0 && (
          <>
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mt-4 mb-2 ml-3">
              Administración
            </div>
            {menuAdministracion.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
                  isActive(item.path)
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </>
        )}

        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mt-4 mb-2 ml-3">
          Reportes
        </div>

        {[
          { path: "/dashboard/reportes/ingresos", icon: TrendUp, label: "Reporte Ingresos" },
          { path: "/dashboard/reportes/egresos", icon: TrendDown, label: "Reporte Egresos" },
          { path: "/dashboard/reportes/balance", icon: Scales, label: "Balance General" },
        ].map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors mb-1 ${
              isActive(item.path)
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
    </>
  );
}
