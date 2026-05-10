"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { TrendDown, CalendarBlank, Receipt } from "@phosphor-icons/react";

export default function ReporteEgresosPage() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('gastos').select('*').order('fecha', { ascending: false });
    setGastos(data || []);
    setLoading(false);
  };

  const filteredGastos = filtroMes
    ? gastos.filter(g => g.fecha && g.fecha.startsWith(filtroMes))
    : gastos;

  const totalEgresos = filteredGastos.reduce((s, g) => s + Number(g.monto || 0), 0);

  // Agrupar por categoría
  const porCategoria = filteredGastos.reduce((acc, g) => {
    const cat = g.categoria || "Sin categoría";
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += Number(g.monto || 0);
    return acc;
  }, {});

  const categorias = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]);

  const coloresCat = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-rose-500",
    "bg-pink-500", "bg-purple-500", "bg-indigo-500", "bg-slate-500"
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reporte de Egresos</h1>
          <p className="text-slate-500 text-sm mt-1">Consolidado de todos los gastos de la cooperativa</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarBlank size={18} className="text-slate-400" />
          <input
            type="month"
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm"
          />
          {filtroMes && <button onClick={() => setFiltroMes("")} className="text-sm text-slate-500 hover:text-red-500 underline">Quitar filtro</button>}
        </div>
      </div>

      {/* Total destacado */}
      <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 mb-6 text-white shadow-xl shadow-red-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100 text-sm font-medium">Total Egresos {filtroMes ? `(${filtroMes})` : ""}</p>
            <p className="text-4xl font-bold mt-1">Bs. {totalEgresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <TrendDown size={32} weight="bold" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Desglose por categoría */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-5">Desglose por Categoría</h2>
          {categorias.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay datos.</p>
          ) : (
            <div className="space-y-3">
              {categorias.map(([cat, total], idx) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{cat}</span>
                    <span className="text-red-600 dark:text-red-400 font-bold">Bs. {total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${coloresCat[idx % coloresCat.length]} rounded-full transition-all`}
                      style={{ width: `${totalEgresos > 0 ? (total / totalEgresos * 100) : 0}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 text-right">{(totalEgresos > 0 ? (total / totalEgresos * 100) : 0).toFixed(1)}%</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top gastos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-5">Mayores Gastos</h2>
          {filteredGastos.length === 0 ? (
            <p className="text-slate-400 text-sm">No hay datos.</p>
          ) : (
            <div className="space-y-3">
              {[...filteredGastos].sort((a, b) => b.monto - a.monto).slice(0, 5).map((g, idx) => (
                <div key={g.id} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{g.concepto || g.descripcion}</p>
                    <p className="text-xs text-slate-400">{g.categoria}</p>
                  </div>
                  <span className="font-bold text-red-600 dark:text-red-400 text-sm whitespace-nowrap">Bs. {Number(g.monto).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla detalle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
          <Receipt size={20} className="text-slate-400" />
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Detalle de Gastos</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Concepto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Fecha</th>
                <th className="p-4 pr-6 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">Cargando...</td></tr>
              ) : filteredGastos.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No hay gastos para el período seleccionado.</td></tr>
              ) : (
                filteredGastos.map(g => (
                  <tr key={g.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6 font-medium text-slate-700 dark:text-slate-300">{g.concepto || g.descripcion}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        {g.categoria || "General"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-sm">{g.fecha ? new Date(g.fecha).toLocaleDateString() : '-'}</td>
                    <td className="p-4 pr-6 text-right font-bold text-red-600 dark:text-red-400">
                      - Bs. {Number(g.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
