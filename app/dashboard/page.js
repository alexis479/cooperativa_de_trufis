"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { Users, CurrencyCircleDollar, Car, PlusCircle, CheckCircle, Receipt } from "@phosphor-icons/react";
import Link from "next/link";

export default function DashboardHome() {
  const [stats, setStats] = useState({ socios: 0, vehiculos: 0, recaudacion: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Cargar Socios
        const { count: sociosCount } = await supabase.from('socios').select('*', { count: 'exact', head: true });
        
        // Cargar Vehículos
        const { count: vehiculosCount } = await supabase.from('vehiculos').select('*', { count: 'exact', head: true });
        
        // Calcular Recaudación (Aportes + Alquileres + Multas Pagadas)
        const { data: aportes } = await supabase.from('aportes').select('monto');
        const { data: alquileres } = await supabase.from('alquiler_de_lineas').select('monto');
        const { data: multas } = await supabase.from('multas').select('monto').eq('estado', 'pagado');
        
        let total = 0;
        aportes?.forEach(a => total += Number(a.monto));
        alquileres?.forEach(a => total += Number(a.monto));
        multas?.forEach(m => total += Number(m.monto));

        setStats({
          socios: sociosCount || 0,
          vehiculos: vehiculosCount || 0,
          recaudacion: total
        });
      } catch (err) {
        console.error("Error cargando estadísticas", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard Principal</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Socios</span>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users size={24} weight="fill" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{stats.socios}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Socios inscritos en el sistema</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Recaudación Total</span>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CurrencyCircleDollar size={24} weight="fill" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Bs. {stats.recaudacion.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Total cobrado (Inscripciones + Cuotas)</div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Flota Total</span>
            <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Car size={24} weight="fill" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{stats.vehiculos}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">Vehículos registrados</div>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Link href="/dashboard/aportes" className="group">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-dashed border-slate-300 dark:border-slate-600 flex items-center gap-4 transition-all group-hover:-translate-y-1 group-hover:border-emerald-500">
              <PlusCircle size={28} className="text-emerald-500" />
              <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-emerald-500">Nuevo Aporte</span>
            </div>
          </Link>
          <Link href="/dashboard/asistencias" className="group">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-dashed border-slate-300 dark:border-slate-600 flex items-center gap-4 transition-all group-hover:-translate-y-1 group-hover:border-blue-500">
              <CheckCircle size={28} className="text-blue-500" />
              <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-500">Tomar Asistencia</span>
            </div>
          </Link>
          <Link href="/dashboard/gastos" className="group">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-dashed border-slate-300 dark:border-slate-600 flex items-center gap-4 transition-all group-hover:-translate-y-1 group-hover:border-red-500">
              <Receipt size={28} className="text-red-500" />
              <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-red-500">Registrar Gasto</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
