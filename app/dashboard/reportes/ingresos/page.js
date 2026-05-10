"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { TrendUp, Money, ArrowUp, ArrowDown, CalendarBlank } from "@phosphor-icons/react";

export default function ReporteIngresosPage() {
  const [aportes, setAportes] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [multas, setMultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroMes, setFiltroMes] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: a }, { data: p }, { data: m }] = await Promise.all([
      supabase.from('aportes').select('monto, fecha, motivo'),
      supabase.from('prestamos').select('monto, fecha_prestamo, cuota_mensual').eq('estado', 'pagado'),
      supabase.from('multas').select('monto, fecha').eq('estado', 'pagado'),
    ]);
    setAportes(a || []);
    setPrestamos(p || []);
    setMultas(m || []);
    setLoading(false);
  };

  const filterByMes = (items, dateField) => {
    if (!filtroMes) return items;
    return items.filter(i => i[dateField] && i[dateField].startsWith(filtroMes));
  };

  const filteredAportes = filterByMes(aportes, 'fecha');
  const filteredPrestamos = filterByMes(prestamos, 'fecha_prestamo');
  const filteredMultas = filterByMes(multas, 'fecha');

  const totalAportes = filteredAportes.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalPrestamos = filteredPrestamos.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalMultas = filteredMultas.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalIngresos = totalAportes + totalPrestamos + totalMultas;

  const cards = [
    { label: "Total Aportes", value: totalAportes, color: "emerald", icon: Money },
    { label: "Préstamos Pagados", value: totalPrestamos, color: "blue", icon: ArrowUp },
    { label: "Multas Cobradas", value: totalMultas, color: "amber", icon: ArrowDown },
  ];

  const allItems = [
    ...filteredAportes.map(a => ({ tipo: "Aporte", descripcion: a.motivo || "Aporte", monto: a.monto, fecha: a.fecha })),
    ...filteredPrestamos.map(p => ({ tipo: "Préstamo Pagado", descripcion: "Préstamo recuperado", monto: p.monto, fecha: p.fecha_prestamo })),
    ...filteredMultas.map(m => ({ tipo: "Multa Cobrada", descripcion: "Multa pagada", monto: m.monto, fecha: m.fecha })),
  ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reporte de Ingresos</h1>
          <p className="text-slate-500 text-sm mt-1">Consolidado de todos los ingresos de la cooperativa</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarBlank size={18} className="text-slate-400" />
          <input
            type="month"
            value={filtroMes}
            onChange={e => setFiltroMes(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
          />
          {filtroMes && <button onClick={() => setFiltroMes("")} className="text-sm text-slate-500 hover:text-red-500 underline">Quitar filtro</button>}
        </div>
      </div>

      {/* Tarjeta total destacada */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 mb-6 text-white shadow-xl shadow-emerald-500/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm font-medium">Total Ingresos {filtroMes ? `(${filtroMes})` : ""}</p>
            <p className="text-4xl font-bold mt-1">Bs. {totalIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <TrendUp size={32} weight="bold" />
          </div>
        </div>
      </div>

      {/* Tarjetas por categoría */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{card.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">Bs. {card.value.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-slate-400 mt-1">{(totalIngresos > 0 ? (card.value / totalIngresos * 100) : 0).toFixed(1)}% del total</p>
            <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${totalIngresos > 0 ? (card.value / totalIngresos * 100) : 0}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Detalle */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-slate-100">Detalle de Transacciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Tipo</th>
                <th className="p-4">Descripción</th>
                <th className="p-4">Fecha</th>
                <th className="p-4 pr-6 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">Cargando...</td></tr>
              ) : allItems.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No hay ingresos para el período seleccionado.</td></tr>
              ) : (
                allItems.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        {item.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{item.descripcion}</td>
                    <td className="p-4 text-slate-500 text-sm">{item.fecha ? new Date(item.fecha).toLocaleDateString() : '-'}</td>
                    <td className="p-4 pr-6 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      + Bs. {Number(item.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
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
