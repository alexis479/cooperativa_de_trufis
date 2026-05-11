"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Printer, CalendarBlank, FileText } from "@phosphor-icons/react";

export default function ReporteEgresosPage() {
  const [gastos, setGastos] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchData(); }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    const start = fechaInicio;
    const end = fechaFin;

    const [{ data: gastosData }, { data: prestamosData }] = await Promise.all([
      supabase.from('gastos')
        .select('*')
        .gte('fecha', start)
        .lte('fecha', end),
      supabase.from('prestamos')
        .select('*, socios(nombre, apellido)')
        .gte('fecha_inicio', start)
        .lte('fecha_inicio', end),
    ]);

    setGastos(gastosData || []);
    setPrestamos(prestamosData || []);
    setLoading(false);
  };

  const handlePrint = () => { window.print(); };

  // Agrupación de Egresos
  const gastosFijos = gastos.filter(g => g.categoria?.toLowerCase().includes('sueldo') || g.categoria?.toLowerCase().includes('fijo'));
  const gastosVariables = gastos.filter(g => !g.categoria?.toLowerCase().includes('sueldo') && !g.categoria?.toLowerCase().includes('fijo'));
  
  const totalFijos = gastosFijos.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalVariables = gastosVariables.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalPrestamos = prestamos.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalEgresos = totalFijos + totalVariables + totalPrestamos;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:bg-white print:p-0">
      {/* Estilos específicos para impresión (Igual que Ingresos) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: legal;
          margin: 0.3cm;
        }
        @media print {
          nav, aside, header, .print-hidden, button, input, .no-print, ::-webkit-scrollbar {
            display: none !important;
          }
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            height: auto !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .report-sheet {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0.4cm !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 8.5pt !important;
            zoom: 0.82;
          }
          th, td { padding: 4px 8px !important; }
          .space-y-10 > * + * { margin-top: 0.6rem !important; }
          .bg-emerald-900 {
            background-color: #064e3b !important;
            color: white !important;
          }
          .bg-red-50\/30 {
            background-color: #fef2f2 !important;
            -webkit-print-color-adjust: exact;
          }
          table { page-break-inside: avoid; }
          .signatures-area { margin-top: 1cm !important; page-break-inside: avoid; }
          .totals-area { margin-top: 0.5cm !important; padding: 10px !important; }
        }
      ` }} />

      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 mb-8 bg-slate-900 text-white p-4 rounded-2xl shadow-xl print-hidden no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 flex-shrink-0">
            <FileText size={24} weight="bold" />
          </div>
          <div><h1 className="font-bold text-lg">Reporte de Egresos</h1><p className="text-slate-400 text-xs tracking-tight">Gestión de gastos y préstamos otorgados</p></div>
        </div>
        <div className="flex flex-wrap items-end gap-3 w-full sm:w-auto">
          <div className="flex flex-col gap-0.5 flex-1 min-w-[140px]">
            <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Fecha Inicio</label>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-medium text-white cursor-pointer w-full" />
            </div>
          </div>
          
          <div className="flex flex-col gap-0.5 flex-1 min-w-[140px]">
            <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Fecha Fin</label>
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700">
              <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm font-medium text-white cursor-pointer w-full" />
            </div>
          </div>

          <button onClick={handlePrint} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-2.5 rounded-xl transition-all font-bold text-sm shadow-lg shadow-red-500/20 whitespace-nowrap">
            <Printer size={18} weight="bold" /> Imprimir
          </button>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto bg-[#fffcfc] p-4 md:p-12 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-4 rounded-sm report-sheet">
        <div className="text-center mb-10 space-y-2 border-b-2 border-emerald-900 pb-6">
          <h2 className="text-emerald-900 text-xl md:text-2xl font-black uppercase tracking-widest">Cooperativa de Transporte Cumbre de las Américas</h2>
          <div className="inline-block bg-emerald-900 text-white px-6 py-1.5 rounded-full font-bold text-sm tracking-widest uppercase">Reporte de Egresos</div>
          <p className="text-slate-600 font-bold text-sm pt-2 italic">RANGO: {new Date(fechaInicio).toLocaleDateString()} AL {new Date(fechaFin).toLocaleDateString()}</p>
        </div>

        {loading ? (
          <div className="py-20 text-center"><div className="w-12 h-12 border-4 border-red-900/10 border-t-red-900 rounded-full animate-spin mx-auto mb-4"></div><p className="text-slate-500 font-bold">Cargando egresos...</p></div>
        ) : (
          <div className="space-y-10">
            <ReportSection title="Gastos Variables" items={gastosVariables} total={totalVariables} type="gasto" />
            <ReportSection title="Gastos Fijos" items={gastosFijos} total={totalFijos} type="gasto" />
            <ReportSection title="Préstamos Otorgados" items={prestamos} total={totalPrestamos} type="prestamo" />

            <div className="mt-10 pt-6 border-t-4 border-emerald-900 bg-red-50/30 p-4 rounded-2xl totals-area text-right">
              <div className="space-y-3 max-w-md ml-auto">
                <SummaryRow label="GASTOS VARIABLES" value={totalVariables} />
                <SummaryRow label="GASTOS FIJOS" value={totalFijos} />
                <SummaryRow label="TOTAL PRÉSTAMOS" value={totalPrestamos} />
                <div className="flex justify-between text-red-900 text-2xl font-black pt-4 border-t-2 border-emerald-900/20">
                  <span>TOTAL EGRESOS:</span>
                  <span>- Bs. {totalEgresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:gap-20 pt-10 text-center signatures-area">
              <div className="border-t-2 border-slate-900 pt-3 font-black text-slate-900 uppercase text-xs sm:text-sm">Firma del Tesorero</div>
              <div className="border-t-2 border-slate-900 pt-3 font-black text-slate-900 uppercase text-xs sm:text-sm">Firma del Presidente</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-slate-600 font-bold text-sm">
      <span>{label}:</span>
      <span>- Bs. {value.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
    </div>
  );
}

function ReportSection({ title, items, total, type }) {
  return (
    <div className="space-y-3">
      <div className="bg-emerald-900 text-white px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest rounded-r-lg inline-block">{title}</div>
      <div className="border-2 border-emerald-900/10 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="bg-emerald-900/5 text-emerald-900 font-black uppercase">
              <th className="p-3 border-b border-emerald-900/20 w-8">Nº</th>
              <th className="p-3 border-b border-emerald-900/20">Fecha</th>
              <th className="p-3 border-b border-emerald-900/20">{type === 'prestamo' ? 'Socio' : 'Descripción'}</th>
              {type === 'prestamo' && <th className="p-3 border-b border-emerald-900/20 text-center">Interés %</th>}
              {type === 'prestamo' && <th className="p-3 border-b border-emerald-900/20 text-center">Estado</th>}
              <th className="p-3 border-b border-emerald-900/20 text-right">Monto (Bs.)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={type === 'prestamo' ? 6 : 4} className="p-4 text-center text-slate-400 italic">No hay registros en esta sección.</td></tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-white transition-colors">
                  <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3 text-slate-600">{new Date(item.fecha || item.fecha_inicio).toLocaleDateString()}</td>
                  <td className="p-3 font-bold text-slate-800">
                    {type === 'prestamo' ? `${item.socios?.nombre || ''} ${item.socios?.apellido || 'Socio'}` : (item.concepto || item.descripcion)}
                  </td>
                  {type === 'prestamo' && <td className="p-3 text-center">{item.interes}%</td>}
                  {type === 'prestamo' && <td className="p-3 text-center uppercase text-[9px] font-bold text-slate-500">{item.estado}</td>}
                  <td className="p-3 text-right font-black text-red-900">
                    {Number(item.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
            <tr className="bg-red-50/20">
              <td colSpan={type === 'prestamo' ? 5 : 3} className="p-3 text-right font-black text-emerald-900 uppercase">Subtotal {title.split(' ')[0]}</td>
              <td className="p-3 text-right font-black text-red-900 border-t-2 border-emerald-900/20">Bs. {total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
