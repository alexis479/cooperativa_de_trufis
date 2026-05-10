"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Scales, TrendUp, TrendDown, ArrowUpRight, ArrowDownRight, CalendarBlank } from "@phosphor-icons/react";

export default function BalancePage() {
  const [data, setData] = useState({ aportes: 0, prestamos: 0, multas: 0, gastos: 0 });
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState("");

  useEffect(() => { fetchData(); }, [filtroMes]);

  const fetchData = async () => {
    setLoading(true);

    const mesFilter = (query, field) => filtroMes ? query.gte(field, filtroMes + '-01').lt(field, nextMonth(filtroMes)) : query;

    const [
      { data: aportes },
      { data: multas },
      { data: gastos },
    ] = await Promise.all([
      mesFilter(supabase.from('aportes').select('monto'), 'fecha'),
      mesFilter(supabase.from('multas').select('monto').eq('estado', 'pagado'), 'fecha'),
      mesFilter(supabase.from('gastos').select('monto'), 'fecha'),
    ]);

    const sum = (arr) => (arr || []).reduce((s, i) => s + Number(i.monto || 0), 0);

    setData({
      aportes: sum(aportes),
      multas: sum(multas),
      gastos: sum(gastos),
    });
    setLoading(false);
  };

  const nextMonth = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  };

  const totalIngresos = data.aportes + data.multas;
  const totalEgresos = data.gastos;
  const balance = totalIngresos - totalEgresos;
  const positivo = balance >= 0;

  const metricas = [
    { label: "Total Ingresos", value: totalIngresos, color: "emerald", icon: TrendUp, prefix: "+ " },
    { label: "Total Egresos", value: totalEgresos, color: "red", icon: TrendDown, prefix: "- " },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Balance General</h1>
          <p className="text-slate-500 text-sm mt-1">Estado financiero consolidado de la cooperativa</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarBlank size={18} className="text-slate-400" />
          <input
            type="month"
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
          />
          {filtroMes && <button onClick={() => setFiltroMes("")} className="text-sm text-slate-500 hover:text-red-500 underline">Todo el tiempo</button>}
        </div>
      </div>

      {/* Balance Card */}
      <div className={`rounded-2xl p-8 mb-8 text-white shadow-2xl bg-gradient-to-br ${positivo ? 'from-emerald-500 to-teal-600 shadow-emerald-500/20' : 'from-red-500 to-rose-600 shadow-red-500/20'}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-2">
              Saldo Neto {filtroMes ? `(${filtroMes})` : "Total"}
            </p>
            <p className="text-5xl font-extrabold tracking-tight">
              Bs. {Math.abs(balance).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center gap-1.5 mt-3 ${positivo ? 'text-emerald-100' : 'text-red-100'}`}>
              {positivo ? <ArrowUpRight size={20} weight="bold" /> : <ArrowDownRight size={20} weight="bold" />}
              <span className="font-semibold">{positivo ? "Superávit — La cooperativa tiene ganancias" : "Déficit — Los gastos superan los ingresos"}</span>
            </div>
          </div>
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center">
            <Scales size={40} weight="fill" />
          </div>
        </div>
      </div>

      {/* Ingresos vs Egresos */}
      <div className="grid grid-cols-2 gap-5 mb-8">
        {metricas.map(m => (
          <div key={m.label} className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6`}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{m.label}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                m.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
              }`}>
                <m.icon size={20} />
              </div>
            </div>
            <p className={`text-3xl font-extrabold ${m.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              Bs. {m.value.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      {/* Barra comparativa */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-5">Comparativo Visual</h2>
        {loading ? (
          <div className="h-12 flex items-center justify-center text-slate-400">Cargando...</div>
        ) : totalIngresos + totalEgresos === 0 ? (
          <p className="text-slate-400 text-sm">No hay movimientos registrados para el período.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Ingresos</span>
                <span className="font-bold text-emerald-600">Bs. {totalIngresos.toLocaleString()}</span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all" style={{ width: `${(totalIngresos / (totalIngresos + totalEgresos) * 100).toFixed(1)}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span> Egresos</span>
                <span className="font-bold text-red-600">Bs. {totalEgresos.toLocaleString()}</span>
              </div>
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all" style={{ width: `${(totalEgresos / (totalIngresos + totalEgresos) * 100).toFixed(1)}%` }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desglose de ingresos */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4">Composición de Ingresos</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Aportes de Socios", value: data.aportes, color: "emerald" },
            { label: "Multas Cobradas", value: data.multas, color: "amber" },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50">
              <div className={`w-3 h-10 rounded-full ${row.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{row.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Bs. {row.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
