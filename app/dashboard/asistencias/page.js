"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { CalendarCheck, MagnifyingGlass, CheckCircle, XCircle } from "@phosphor-icons/react";

export default function AsistenciasPage() {
  const [socios, setSocios] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loading, setLoading] = useState(true);
  const [fechaReunion, setFechaReunion] = useState(new Date().toISOString().split('T')[0]);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    fetchSociosYAsistencias();
  }, [fechaReunion]);

  const fetchSociosYAsistencias = async () => {
    setLoading(true);
    
    // 1. Cargar todos los socios
    const { data: sociosData } = await supabase
      .from('socios')
      .select('id, nombre, apellido, numero_interno')
      .eq('estado', 'activo')
      .order('numero_interno');
      
    if (sociosData) setSocios(sociosData);

    // 2. Cargar las asistencias de la fecha seleccionada
    const { data: asisData } = await supabase
      .from('asistencias')
      .select('*')
      .eq('fecha', fechaReunion);

    if (asisData) {
      // Convertir el arreglo en un mapa para rápido acceso
      const mapAsis = {};
      asisData.forEach(a => {
        mapAsis[a.socio_id] = { id: a.id, presente: a.presente, observacion: a.observacion || "" };
      });
      setAsistencias(mapAsis);
    } else {
      setAsistencias({});
    }
    
    setLoading(false);
  };

  const handleToggleAsistencia = async (socio_id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    const asistenciaActual = asistencias[socio_id];

    if (asistenciaActual && asistenciaActual.id) {
      // Actualizar registro existente
      const { error } = await supabase
        .from('asistencias')
        .update({ presente: nuevoEstado })
        .eq('id', asistenciaActual.id);
        
      if (!error) {
        setAsistencias(prev => ({
          ...prev,
          [socio_id]: { ...prev[socio_id], presente: nuevoEstado }
        }));
      }
    } else {
      // Crear nuevo registro
      const { data, error } = await supabase
        .from('asistencias')
        .insert([{ socio_id, fecha: fechaReunion, presente: nuevoEstado }])
        .select()
        .single();
        
      if (!error && data) {
        setAsistencias(prev => ({
          ...prev,
          [socio_id]: { id: data.id, presente: data.presente, observacion: "" }
        }));
      }
    }
  };

  const handleObservacionChange = async (socio_id, obsValue) => {
    const asistenciaActual = asistencias[socio_id];
    
    if (asistenciaActual && asistenciaActual.id) {
      // Actualizar solo el estado local para fluidez
      setAsistencias(prev => ({
        ...prev,
        [socio_id]: { ...prev[socio_id], observacion: obsValue }
      }));
    }
  };

  const handleBlurObservacion = async (socio_id, obsValue) => {
    const asistenciaActual = asistencias[socio_id];
    if (asistenciaActual && asistenciaActual.id) {
      // Guardar en BD al quitar el foco (blur)
      await supabase.from('asistencias').update({ observacion: obsValue }).eq('id', asistenciaActual.id);
    } else if (obsValue) {
      // Si escribió observacion pero no había marcado asistencia, creamos el registro como "ausente" por defecto con observacion
      const { data, error } = await supabase
        .from('asistencias')
        .insert([{ socio_id, fecha: fechaReunion, presente: false, observacion: obsValue }])
        .select()
        .single();
        
      if (!error && data) {
        setAsistencias(prev => ({
          ...prev,
          [socio_id]: { id: data.id, presente: data.presente, observacion: data.observacion }
        }));
      }
    }
  };

  const sociosFiltrados = socios.filter(s => 
    `${s.nombre} ${s.apellido} ${s.numero_interno}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Asistencia a Reuniones</h1>
          <p className="text-slate-500 text-sm mt-1">Toma rápida de lista para la reunión de la cooperativa</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <label className="text-sm font-medium text-slate-600 dark:text-slate-400 pl-2">Fecha:</label>
          <input 
            type="date" 
            value={fechaReunion}
            onChange={(e) => setFechaReunion(e.target.value)}
            className="px-3 py-1.5 rounded-lg border-none bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-0 cursor-pointer"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">
        
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div className="relative w-72">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar socio o nº interno..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Total Socios: {socios.length} | Presentes: {Object.values(asistencias).filter(a => a.presente).length}
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm">
                <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-6 w-24">Nº Int</th>
                  <th className="p-4">Socio</th>
                  <th className="p-4 text-center w-32">Asistencia</th>
                  <th className="p-4 pr-6">Observación (Opcional)</th>
                </tr>
              </thead>
              <tbody>
                {sociosFiltrados.map((socio) => {
                  const asis = asistencias[socio.id] || { presente: false, observacion: "" };
                  return (
                    <tr key={socio.id} className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors ${asis.presente ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}>
                      <td className="p-4 pl-6">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 text-sm">
                          {socio.numero_interno}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-900 dark:text-slate-100">
                        {socio.nombre} {socio.apellido}
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleToggleAsistencia(socio.id, asis.presente)}
                          className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all ${
                            asis.presente 
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {asis.presente ? (
                            <><CheckCircle size={18} weight="bold" /> Presente</>
                          ) : (
                            <><XCircle size={18} /> Ausente</>
                          )}
                        </button>
                      </td>
                      <td className="p-4 pr-6">
                        <input 
                          type="text" 
                          placeholder="Añadir nota o excusa..." 
                          value={asis.observacion}
                          onChange={(e) => handleObservacionChange(socio.id, e.target.value)}
                          onBlur={(e) => handleBlurObservacion(socio.id, e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                        />
                      </td>
                    </tr>
                  );
                })}
                {sociosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-slate-500">
                      No se encontraron socios con esa búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
