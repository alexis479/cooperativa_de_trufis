"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Printer, CalendarBlank, FileText } from "@phosphor-icons/react";

export default function ReporteIngresosPage() {
  const [aportes, setAportes] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [multas, setMultas] = useState([]);
  const [alquileres, setAlquileres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchData(); }, [fechaInicio, fechaFin]);

  const fetchData = async () => {
    setLoading(true);
    
    const start = fechaInicio;
    const end = fechaFin;

    const [
      { data: aportesData },
      { data: prestamosData },
      { data: multasData },
      { data: alquileresData }
    ] = await Promise.all([
      supabase.from('aportes')
        .select('*, socios(nombre, apellido)')
        .gte('fecha', start)
        .lte('fecha', end),
      supabase.from('prestamos')
        .select('*, socios(nombre, apellido)')
        .eq('estado', 'pagado')
        .gte('fecha_fin', start)
        .lte('fecha_fin', end),
      supabase.from('multas')
        .select('*')
        .eq('estado', 'pagado')
        .gte('fecha', start)
        .lte('fecha', end),
      supabase.from('alquiler_de_lineas')
        .select('*')
        .eq('estado', 'activo')
        .gte('fecha_inicio', start)
        .lte('fecha_inicio', end),
    ]);

    setAportes(aportesData || []);
    setPrestamos(prestamosData || []);
    setMultas(multasData || []);
    setAlquileres(alquileresData || []);
    setLoading(false);
  };

  const handlePrint = () => { window.print(); };

  // Lógica de Desglose Automático (170 Bs -> 140 Mensual + 30 Ayuda)
  const aportesMensuales = [];
  const aportesAyuda = [];
  const otrosAportes = [];

  aportes.forEach(a => {
    const monto = Number(a.monto);
    if (monto === 170) {
      aportesMensuales.push({ ...a, monto: 140, motivo: "Aporte Mensual (Desglose)" });
      aportesAyuda.push({ ...a, monto: 30, motivo: "Aporte Ayuda (Desglose)" });
    } else if (monto === 140 || a.motivo?.toLowerCase().includes('mensual')) {
      aportesMensuales.push(a);
    } else if (monto === 30 || a.motivo?.toLowerCase().includes('ayuda')) {
      aportesAyuda.push(a);
    } else {
      otrosAportes.push(a);
    }
  });

  const totalMensual = aportesMensuales.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalAyuda = aportesAyuda.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalOtros = otrosAportes.reduce((s, i) => s + Number(i.monto || 0), 0);
  
  // Préstamos: Sumar capital + interés
  const totalPrestamos = prestamos.reduce((s, i) => {
    const interes = Number(i.interes || 0) / 100;
    const montoTotal = Number(i.monto || 0) * (1 + interes);
    return s + montoTotal;
  }, 0);
  
  const totalMultas = multas.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalAlquileres = alquileres.reduce((s, i) => s + Number(i.monto || 0), 0);

  const totalIngresos = totalMensual + totalAyuda + totalOtros + totalPrestamos + totalMultas + totalAlquileres;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:bg-white print:p-0">
      {/* Estilos específicos para impresión */}
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: legal; /* Tamaño Oficio */
          margin: 0.3cm;
        }
        @media print {
          /* Ocultar todo lo que no es el reporte */
          nav, aside, header, .print-hidden, button, input, .no-print, ::-webkit-scrollbar {
            display: none !important;
          }
          
          /* Ajustar el cuerpo de la página */
          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            height: auto !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Contenedor principal del reporte - Compactado con ZOOM */
          .report-sheet {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0.4cm !important;
            border: none !important;
            box-shadow: none !important;
            font-size: 8.5pt !important;
            zoom: 0.82; /* Escala para asegurar que todo quepa */
          }

          /* Compactar tablas */
          th, td {
            padding: 4px 8px !important;
          }

          /* Reducir espacios entre secciones */
          .space-y-10 > * + * {
            margin-top: 0.6rem !important;
          }

          /* Asegurar que se vean los colores de las cabeceras */
          .bg-emerald-900 {
            background-color: #064e3b !important;
            color: white !important;
          }
          
          .bg-emerald-50\/30 {
            background-color: #f0fdf4 !important;
          }

          /* Evitar cortes */
          table { page-break-inside: avoid; }
          .signatures-area {
            margin-top: 1cm !important;
            page-break-inside: avoid;
            border-top: none !important;
          }
          
          .totals-area {
            margin-top: 0.5cm !important;
            padding: 10px !important;
          }
        }
      ` }} />

      {/* Barra de herramientas - Se oculta al imprimir */}
      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start sm:items-center gap-4 mb-8 bg-slate-900 text-white p-4 rounded-2xl shadow-xl print-hidden no-print">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <FileText size={24} weight="bold" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Reporte de Ingresos</h1>
            <p className="text-slate-400 text-xs tracking-tight">Personalización de secciones de ingresos</p>
          </div>
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

          <button onClick={handlePrint} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 rounded-xl transition-all font-bold text-sm whitespace-nowrap">
            <Printer size={18} weight="bold" /> Imprimir
          </button>
        </div>
      </div>

      <div className="max-w-[1000px] mx-auto bg-[#f9fbf9] p-4 md:p-12 shadow-2xl border border-slate-200 print:shadow-none print:border-none print:p-4 rounded-sm report-sheet">
        
        <div className="text-center mb-10 space-y-2 border-b-2 border-emerald-900 pb-6">
          <h2 className="text-emerald-900 text-xl md:text-2xl font-black uppercase tracking-widest">
            Cooperativa de Transporte Cumbre de las Américas
          </h2>
          <div className="inline-block bg-emerald-900 text-white px-6 py-1.5 rounded-full font-bold text-sm tracking-widest uppercase">
            Reporte de Ingresos
          </div>
          <p className="text-slate-600 font-bold text-sm pt-2 italic">
            RANGO: {new Date(fechaInicio).toLocaleDateString()} AL {new Date(fechaFin).toLocaleDateString()}
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center"><div className="w-12 h-12 border-4 border-emerald-900/10 border-t-emerald-900 rounded-full animate-spin mx-auto mb-4"></div><p className="text-slate-500 font-bold">Cargando datos...</p></div>
        ) : (
          <div className="space-y-10">
            
            <ReportSection title="Aportes de Socios (Mensuales)" items={aportesMensuales} total={totalMensual} type="socio" />
            
            <ReportSection title="Aporte Ayuda (30 Bs. P/ Socio)" items={aportesAyuda} total={totalAyuda} type="socio" />

            <ReportSection title="Alquiler de Líneas" items={alquileres} total={totalAlquileres} type="alquiler" />

            <ReportSection title="Pago de Préstamos" items={prestamos} total={totalPrestamos} type="prestamo" />

            <ReportSection title="Multas Cobradas" items={multas} total={totalMultas} type="multa" />

            {otrosAportes.length > 0 && (
              <ReportSection title="Otros Aportes / Ingresos" items={otrosAportes} total={totalOtros} type="socio" />
            )}

            <div className="mt-10 pt-6 border-t-4 border-emerald-900 bg-emerald-50/30 p-4 rounded-2xl totals-area">
              <div className="space-y-3 max-w-md ml-auto text-right">
                <SummaryRow label="TOTAL APORTE MENSUAL" value={totalMensual} />
                <SummaryRow label="TOTAL APORTE AYUDA" value={totalAyuda} />
                <SummaryRow label="TOTAL ALQUILERES" value={totalAlquileres} />
                <SummaryRow label="TOTAL PRÉSTAMOS" value={totalPrestamos} />
                <SummaryRow label="TOTAL MULTAS" value={totalMultas} />
                <div className="flex justify-between text-emerald-900 text-2xl font-black pt-4 border-t-2 border-emerald-900/20">
                  <span>TOTAL INGRESOS:</span>
                  <span>Bs. {totalIngresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
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
      <span>Bs. {value.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
    </div>
  );
}

function ReportSection({ title, items, total, type }) {
  return (
    <div className="space-y-3">
      <div className="bg-emerald-900 text-white px-4 py-1.5 font-bold uppercase text-[10px] tracking-widest rounded-r-lg inline-block">
        {title}
      </div>
      <div className="border-2 border-emerald-900/10 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="bg-emerald-900/5 text-emerald-900 font-black uppercase">
              <th className="p-3 border-b border-emerald-900/20 w-8">Nº</th>
              <th className="p-3 border-b border-emerald-900/20">{type === 'alquiler' ? 'Fecha Inicio' : 'Fecha'}</th>
              <th className="p-3 border-b border-emerald-900/20">{type === 'alquiler' ? 'Dueño (Socio)' : 'Socio / Concepto'}</th>
              {type === 'alquiler' && <th className="p-3 border-b border-emerald-900/20">Chofer</th>}
              {type === 'prestamo' && <th className="p-3 border-b border-emerald-900/20 text-center">Interés %</th>}
              <th className="p-3 border-b border-emerald-900/20 text-right">Monto (Bs.)</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={type === 'alquiler' ? 5 : (type === 'prestamo' ? 5 : 4)} className="p-4 text-center text-slate-400 italic">No hay registros.</td></tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-white transition-colors">
                  <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                  <td className="p-3 text-slate-600">{new Date(item.fecha || (type === 'prestamo' ? item.fecha_fin : item.fecha_inicio)).toLocaleDateString()}</td>
                  <td className="p-3 font-bold text-slate-800">
                    {type === 'socio' || type === 'prestamo' ? `${item.socios?.nombre || ''} ${item.socios?.apellido || 'Socio Desconocido'}` : (item.nombre_socio || item.nombre || 'N/A')}
                    {type !== 'alquiler' && type !== 'prestamo' && <span className="block text-[9px] font-medium text-slate-500 uppercase">{item.motivo || item.descripcion || ''}</span>}
                  </td>
                  {type === 'alquiler' && <td className="p-3 text-slate-700">{item.nombre_chofer}</td>}
                  {type === 'prestamo' && <td className="p-3 text-center font-bold text-emerald-700">{item.interes}%</td>}
                  <td className="p-3 text-right font-black text-emerald-900">
                    {type === 'prestamo' 
                      ? (Number(item.monto) * (1 + (Number(item.interes || 0) / 100))).toLocaleString('es-BO', { minimumFractionDigits: 2 })
                      : Number(item.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
            <tr className="bg-emerald-50/50">
              <td colSpan={type === 'alquiler' ? 4 : (type === 'prestamo' ? 4 : 3)} className="p-3 text-right font-black text-emerald-900 uppercase">
                {title.startsWith('Alquiler') ? 'Subtotal Alquileres' : `Total ${title.split(' ')[0]}`}
              </td>
              <td className="p-3 text-right font-black text-emerald-900 border-t-2 border-emerald-900/20">
                Bs. {total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
