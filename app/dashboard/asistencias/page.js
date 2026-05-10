"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { CalendarCheck, MagnifyingGlass, CheckCircle, XCircle, Users, ArrowLeft, Plus, UsersThree } from "@phosphor-icons/react";

export default function AsistenciasPage() {
  const [vistaActual, setVistaActual] = useState("lista"); // 'lista' o 'detalle'
  
  // Estados para Vista Lista
  const [reuniones, setReuniones] = useState([]);
  const [loadingReuniones, setLoadingReuniones] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split('T')[0]);
  const [creandoReunion, setCreandoReunion] = useState(false);

  // Estados para Vista Detalle
  const [fechaReunion, setFechaReunion] = useState("");
  const [socios, setSocios] = useState([]);
  const [asistencias, setAsistencias] = useState({});
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    if (vistaActual === "lista") {
      fetchReuniones();
    } else if (vistaActual === "detalle" && fechaReunion) {
      fetchSociosYAsistencias();
    }
  }, [vistaActual, fechaReunion]);

  // --- LOGICA VISTA LISTA ---
  const fetchReuniones = async () => {
    setLoadingReuniones(true);
    const { data } = await supabase.from('asistencias').select('fecha, presente');
    
    if (data) {
      const agrupadas = {};
      data.forEach(a => {
        if (!agrupadas[a.fecha]) {
          agrupadas[a.fecha] = { fecha: a.fecha, total: 0, presentes: 0 };
        }
        agrupadas[a.fecha].total += 1;
        if (a.presente) agrupadas[a.fecha].presentes += 1;
      });
      const arr = Object.values(agrupadas).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      setReuniones(arr);
    }
    setLoadingReuniones(false);
  };

  const handleCrearReunion = async (e) => {
    e.preventDefault();
    if (!nuevaFecha) return;
    setCreandoReunion(true);

    // Verificar si ya existe en la lista
    const existe = reuniones.find(r => r.fecha === nuevaFecha);
    
    if (!existe) {
      // Obtener todos los socios activos para crear su registro base de asistencia (ausente por defecto)
      const { data: sociosActivos } = await supabase.from('socios').select('id').eq('estado', 'activo');
      if (sociosActivos && sociosActivos.length > 0) {
        const inserts = sociosActivos.map(s => ({ socio_id: s.id, fecha: nuevaFecha, presente: false }));
        await supabase.from('asistencias').insert(inserts);
      }
    }
    
    setCreandoReunion(false);
    setIsModalOpen(false);
    setFechaReunion(nuevaFecha);
    setVistaActual("detalle");
  };

  const abrirReunion = (fecha) => {
    setFechaReunion(fecha);
    setVistaActual("detalle");
  };


  // --- LOGICA VISTA DETALLE ---
  const fetchSociosYAsistencias = async () => {
    setLoadingDetalle(true);
    const { data: sociosData } = await supabase.from('socios').select('id, nombre, apellido, numero_interno').eq('estado', 'activo').order('numero_interno');
    if (sociosData) setSocios(sociosData);

    const { data: asisData } = await supabase.from('asistencias').select('*').eq('fecha', fechaReunion);
    if (asisData) {
      const mapAsis = {};
      asisData.forEach(a => {
        mapAsis[a.socio_id] = { id: a.id, presente: a.presente, observacion: a.observacion || "" };
      });
      setAsistencias(mapAsis);
    } else {
      setAsistencias({});
    }
    setLoadingDetalle(false);
  };

  const handleToggleAsistencia = async (socio_id, estadoActual) => {
    const nuevoEstado = !estadoActual;
    const asistenciaActual = asistencias[socio_id];

    if (asistenciaActual && asistenciaActual.id) {
      const { error } = await supabase.from('asistencias').update({ presente: nuevoEstado }).eq('id', asistenciaActual.id);
      if (!error) {
        setAsistencias(prev => ({...prev, [socio_id]: { ...prev[socio_id], presente: nuevoEstado }}));
      }
    } else {
      const { data, error } = await supabase.from('asistencias').insert([{ socio_id, fecha: fechaReunion, presente: nuevoEstado }]).select().single();
      if (!error && data) {
        setAsistencias(prev => ({...prev, [socio_id]: { id: data.id, presente: data.presente, observacion: "" }}));
      }
    }
  };

  const handleObservacionChange = (socio_id, obsValue) => {
    setAsistencias(prev => ({
      ...prev,
      [socio_id]: { ...(prev[socio_id] || {}), observacion: obsValue }
    }));
  };

  const handleBlurObservacion = async (socio_id, obsValue) => {
    const asistenciaActual = asistencias[socio_id];
    if (asistenciaActual && asistenciaActual.id) {
      await supabase.from('asistencias').update({ observacion: obsValue }).eq('id', asistenciaActual.id);
    } else if (obsValue) {
      const { data, error } = await supabase.from('asistencias').insert([{ socio_id, fecha: fechaReunion, presente: false, observacion: obsValue }]).select().single();
      if (!error && data) {
        setAsistencias(prev => ({...prev, [socio_id]: { id: data.id, presente: data.presente, observacion: data.observacion }}));
      }
    }
  };

  const formatearFecha = (fechaStr) => {
    // Para evitar desfases horarios añadimos T12:00:00
    return new Date(fechaStr + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const sociosFiltrados = socios.filter(s => 
    `${s.nombre} ${s.apellido} ${s.numero_interno}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div>
      {vistaActual === "lista" ? (
        // ================= VISTA DE LISTA DE REUNIONES =================
        <div className="animate-in fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Historial de Reuniones</h1>
              <p className="text-slate-500 text-sm mt-1">Gestiona las asistencias de todas las asambleas</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              <Plus size={20} weight="bold" />
              <span>Nueva Reunión</span>
            </button>
          </div>

          {loadingReuniones ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            </div>
          ) : reuniones.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CalendarCheck size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">No hay reuniones registradas</h3>
              <p className="text-slate-500 mb-6">Aún no se ha tomado asistencia de ninguna asamblea.</p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                Crear la primera reunión
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reuniones.map((reunion) => (
                <div key={reunion.fecha} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl flex items-center justify-center">
                      <CalendarCheck size={24} weight="duotone" />
                    </div>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-lg uppercase tracking-wider">
                      {new Date(reunion.fecha + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1 capitalize">
                    {new Date(reunion.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  
                  <div className="flex gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Socios</div>
                      <div className="font-semibold text-slate-700 dark:text-slate-300">{reunion.total}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Asistieron</div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400">{reunion.presentes}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-0.5">Ausentes</div>
                      <div className="font-semibold text-red-500">{reunion.total - reunion.presentes}</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => abrirReunion(reunion.fecha)}
                    className="w-full mt-5 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-700/50 dark:hover:bg-indigo-900/20 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 group-hover:bg-indigo-500 group-hover:text-white"
                  >
                    <UsersThree size={18} />
                    Ver Participantes
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Modal Nueva Reunión */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <form onSubmit={handleCrearReunion} className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Crear Nueva Reunión</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Selecciona la fecha para generar la lista de asistencia.</p>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de la Asamblea</label>
                    <input 
                      type="date" 
                      required 
                      value={nuevaFecha} 
                      onChange={(e) => setNuevaFecha(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" 
                    />
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      disabled={creandoReunion}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-70 flex justify-center items-center"
                    >
                      {creandoReunion ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Crear Reunión"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        // ================= VISTA DE DETALLE DE ASISTENCIA =================
        <div className="animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setVistaActual("lista")}
                className="w-10 h-10 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700 transition-colors"
                title="Volver a Reuniones"
              >
                <ArrowLeft size={20} weight="bold" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3 capitalize">
                  {formatearFecha(fechaReunion)}
                </h1>
                <p className="text-slate-500 text-sm mt-1">Marcando asistencia. Los cambios se guardan automáticamente.</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-190px)]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="relative w-72">
                <MagnifyingGlass size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar socio o nº interno..." 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
              <div className="flex gap-4">
                <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  Total: {socios.length}
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg text-sm font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  Presentes: {Object.values(asistencias).filter(a => a.presente).length}
                </div>
              </div>
            </div>

            <div className="overflow-auto flex-1 p-0">
              {loadingDetalle ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white dark:bg-slate-800 z-10 shadow-sm">
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="p-4 pl-6 w-24">Nº Int</th>
                      <th className="p-4">Socio</th>
                      <th className="p-4 text-center w-36">Asistencia</th>
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
                                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-800' 
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
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors"
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {sociosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-slate-500 flex flex-col items-center">
                          <MagnifyingGlass size={32} className="mb-2 text-slate-300" />
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
      )}
    </div>
  );
}
