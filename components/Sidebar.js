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
  Scales
} from "@phosphor-icons/react";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  return (
    <aside className="w-[260px] bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full transition-colors duration-300">
      <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <Mountains weight="fill" size={24} className="text-emerald-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Coop. Cumbre</h2>
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

        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mt-4 mb-2 ml-3">
          Operaciones
        </div>

        {[
          { path: "/dashboard/alquiler", icon: SteeringWheel, label: "Alquiler de Líneas" },
          { path: "/dashboard/aportes", icon: Money, label: "Aportes" },
          { path: "/dashboard/asistencias", icon: CalendarCheck, label: "Asistencia Reunión" },
          { path: "/dashboard/choferes", icon: UserList, label: "Choferes" },
          { path: "/dashboard/gastos", icon: Receipt, label: "Gastos" },
          { path: "/dashboard/multas", icon: WarningCircle, label: "Multas" },
          { path: "/dashboard/prestamos", icon: HandCoins, label: "Préstamos" },
          { path: "/dashboard/proyectos", icon: Briefcase, label: "Proyectos" },
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

        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mt-4 mb-2 ml-3">
          Administración
        </div>

        {[
          { path: "/dashboard/socios", icon: UsersThree, label: "Socios" },
          { path: "/dashboard/usuarios", icon: UserGear, label: "Usuarios" },
          { path: "/dashboard/roles", icon: ShieldCheck, label: "Roles y Permisos" },
          { path: "/dashboard/vehiculos", icon: Van, label: "Vehículos" },
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
  );
}
