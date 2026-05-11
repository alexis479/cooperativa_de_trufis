"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { CalendarBlank, TrendUp, TrendDown, Wallet } from "@phosphor-icons/react";

export default function BalanceGeneralPage() {
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  const [resumen, setResumen] = useState({
    ingresos: { aportes: 0, alquileres: 0, prestamosRecuperados: 0, multas: 0 },
    egresos: { fijos: 0, variables: 0, prestamosOtorgados: 0 },
  });

  useEffect(() => { fetchData(); }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    const start = fechaInicio;
    const end = fechaFin;

    const [
      { data: aportes },
      { data: alquileres },
      { data: prestamos },
      { data: multas },
      { data: gastos }
    ] = await Promise.all([
      supabase.from('aportes').select('monto').gte('fecha', start).lte('fecha', end),
      supabase.from('alquiler_de_lineas').select('monto').eq('estado', 'activo').gte('fecha_inicio', start).lte('fecha_inicio', end),
      supabase.from('prestamos').select('monto, interes, estado, fecha_fin, fecha_inicio'),
      supabase.from('multas').select('monto').eq('estado', 'pagado').gte('fecha', start).lte('fecha', end),
      supabase.from('gastos').select('monto, categoria').gte('fecha', start).lte('fecha', end),
    ]);

    const totalAportes = (aportes || []).reduce((s, i) => s + Number(i.monto || 0), 0);
    const totalAlquileres = (alquileres || []).reduce((s, i) => s + Number(i.monto || 0), 0);
    const totalMultas = (multas || []).reduce((s, i) => s + Number(i.monto || 0), 0);
    const totalPrestamosRecup = (prestamos || [])
      .filter(p => p.estado === 'pagado' && p.fecha_fin >= start && p.fecha_fin <= end)
      .reduce((s, i) => s + (Number(i.monto) * (1 + (Number(i.interes || 0) / 100))), 0);

    const totalFijos = (gastos || []).filter(g => g.categoria?.toLowerCase().includes('sueldo') || g.categoria?.toLowerCase().includes('fijo')).reduce((s, i) => s + Number(i.monto || 0), 0);
    const totalVariables = (gastos || []).filter(g => !g.categoria?.toLowerCase().includes('sueldo') && !g.categoria?.toLowerCase().includes('fijo')).reduce((s, i) => s + Number(i.monto || 0), 0);
    const totalPrestamosOtorg = (prestamos || [])
      .filter(p => p.fecha_inicio >= start && p.fecha_inicio <= end)
      .reduce((s, i) => s + Number(i.monto || 0), 0);

    setResumen({
      ingresos: { aportes: totalAportes, alquileres: totalAlquileres, prestamosRecuperados: totalPrestamosRecup, multas: totalMultas },
      egresos: { fijos: totalFijos + totalVariables, prestamosOtorgados: totalPrestamosOtorg }
    });

    setLoading(false);
  };

  const totalIngresos = resumen.ingresos.aportes + resumen.ingresos.alquileres + resumen.ingresos.prestamosRecuperados + resumen.ingresos.multas;
  const totalEgresos = resumen.egresos.fijos + resumen.egresos.prestamosOtorgados;
  const saldoNeto = totalIngresos - totalEgresos;

  return (
    <div className="p-6 space-y-8 bg-slate-50 min-h-screen">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Balance General</h1>
          <p className="text-slate-500 font-medium text-sm sm:text-base">Estado financiero consolidado de la cooperativa.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto">
          <div className="flex items-center gap-2 px-3 sm:border-r border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Inicio</span>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 p-0 w-full" />
          </div>
          <div className="flex items-center gap-2 px-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Fin</span>
            <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 p-0 w-full" />
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen (Exactamente como la imagen) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Ingresos" value={totalIngresos} color="emerald" />
        <StatCard label="Total Egresos" value={totalEgresos} color="red" borderLeft />
        <StatCard label="Saldo Neto" value={saldoNeto} color="teal" borderLeft />
      </div>

      {/* Tabla de Resumen por Categoría (Exactamente como la imagen) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900">Resumen por Categoría</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[11px] font-black uppercase tracking-widest">
                <th className="px-8 py-4">Tipo</th>
                <th className="px-8 py-4">Categoría</th>
                <th className="px-8 py-4 text-right">Monto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <CategoryRow type="Ingreso" category="Aportes de Socios" amount={resumen.ingresos.aportes} />
              <CategoryRow type="Ingreso" category="Alquiler de Líneas" amount={resumen.ingresos.alquileres} />
              <CategoryRow type="Ingreso" category="Multas Cobradas" amount={resumen.ingresos.multas} />
              <CategoryRow type="Ingreso" category="Pago de Préstamos" amount={resumen.ingresos.prestamosRecuperados} />
              <CategoryRow type="Egreso" category="Gastos Operativos" amount={resumen.egresos.fijos} />
              <CategoryRow type="Egreso" category="Préstamos Otorgados" amount={resumen.egresos.prestamosOtorgados} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, borderLeft = false }) {
  return (
    <div className={`bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm transition-all hover:shadow-md ${borderLeft ? (color === 'red' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-emerald-500') : ''}`}>
      <p className="text-slate-900 text-2xl font-black mb-1">{label}</p>
      <p className={`text-xl font-bold ${color === 'red' ? 'text-red-500' : 'text-slate-600'}`}>
        Bs. {value.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}

function CategoryRow({ type, category, amount }) {
  const isIngreso = type === "Ingreso";
  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="px-8 py-5">
        <span className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tighter ${isIngreso ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {type}
        </span>
      </td>
      <td className="px-8 py-5 text-slate-700 font-bold text-sm">
        {category}
      </td>
      <td className="px-8 py-5 text-right text-slate-900 font-black text-sm">
        Bs. {amount.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
      </td>
    </tr>
  );
}
