"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, SteeringWheel, CalendarBlank } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

export default function AlquileresPage() {
  const [alquileres, setAlquileres] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [tiposLinea, setTiposLinea] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { permisos } = usePermissions();
  const canEdit = Object.keys(permisos).length === 0 || permisos["alquileres"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["alquileres"]?.eliminar === true;

  const [formData, setFormData] = useState({
    nombre_socio: "",
    nombre_chofer: "",
    numero_interno: "",
    monto: "",
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: "",
    estado: "activo",
    observacion: "",
    linea_id: "",
    tipo_linea_id: ""
  });

  useEffect(() => {
    fetchAlquileres();
    fetchRelaciones();
  }, []);

  const fetchAlquileres = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alquiler_de_lineas')
      .select('*, lineas(nombre), tipo_de_linea(nombre)')
      .order('fecha_inicio', { ascending: false });
      
    if (!error && data) {
      setAlquileres(data);
    }
    setLoading(false);
  };

  const fetchRelaciones = async () => {
    const { data: lineasData } = await supabase.from('lineas').select('*');
    if (lineasData) setLineas(lineasData);

    const { data: tiposData } = await supabase.from('tipo_de_linea').select('*');
    if (tiposData) setTiposLinea(tiposData);
  };

  const handleOpenModal = (alquiler = null) => {
    if (alquiler) {
      setEditingId(alquiler.id);
      setFormData({
        nombre_socio: alquiler.nombre_socio,
        nombre_chofer: alquiler.nombre_chofer,
        numero_interno: alquiler.numero_interno || "",
        monto: alquiler.monto,
        fecha_inicio: alquiler.fecha_inicio,
        fecha_fin: alquiler.fecha_fin || "",
        estado: alquiler.estado,
        observacion: alquiler.observacion || "",
        linea_id: alquiler.linea_id,
        tipo_linea_id: alquiler.tipo_linea_id
      });
    } else {
      setEditingId(null);
      setFormData({ 
        nombre_socio: "", nombre_chofer: "", numero_interno: "", monto: "",
        fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: "",
        estado: "activo", observacion: "", linea_id: "", tipo_linea_id: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.linea_id || !formData.tipo_linea_id) {
      alert("Debes seleccionar la línea y la ruta.");
      return;
    }

    const payload = {
      ...formData,
      monto: parseFloat(formData.monto),
      fecha_fin: formData.fecha_fin ? formData.fecha_fin : null
    };

    if (editingId) {
      const { error } = await supabase.from('alquiler_de_lineas').update(payload).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchAlquileres();
      } else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('alquiler_de_lineas').insert([payload]);
      if (!error) {
        handleCloseModal();
        fetchAlquileres();
      } else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro de alquiler?")) {
      const { error } = await supabase.from('alquiler_de_lineas').delete().eq('id', id);
      if (!error) fetchAlquileres();
      else alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Alquiler de Líneas</h1>
          <p className="text-slate-500 text-sm mt-1">Control de alquileres de líneas a choferes</p>
        </div>
        {canEdit && <button onClick={() => handleOpenModal()} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5"><Plus size={20} weight="bold" /><span>Nuevo Alquiler</span></button>}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Información General</th>
                <th className="p-4 uppercase tracking-wider text-xs">Línea / Ruta</th>
                <th className="p-4 uppercase tracking-wider text-xs">Monto</th>
                <th className="p-4 uppercase tracking-wider text-xs">Vigencia</th>
                <th className="p-4 uppercase tracking-wider text-xs">Estado</th>
                {(canEdit || canDelete) && <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando alquileres...
                  </td>
                </tr>
              ) : alquileres.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No hay alquileres registrados.
                  </td>
                </tr>
              ) : (
                alquileres.map((alquiler) => (
                  <tr key={alquiler.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          Socio: {alquiler.nombre_socio}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Chofer: {alquiler.nombre_chofer}
                        </span>
                        <span className="text-xs text-slate-500">
                          Interno: {alquiler.numero_interno || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <SteeringWheel size={20} className="text-indigo-500" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {alquiler.lineas?.nombre}
                          </span>
                          <span className="text-xs text-slate-500">
                            {alquiler.tipo_de_linea?.nombre}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                      Bs. {parseFloat(alquiler.monto).toLocaleString('es-BO')}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <CalendarBlank size={16} />
                        <span>{new Date(alquiler.fecha_inicio).toLocaleDateString('es-ES')} - {alquiler.fecha_fin ? new Date(alquiler.fecha_fin).toLocaleDateString('es-ES') : 'Indefinido'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        alquiler.estado === 'activo' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                          : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                      }`}>
                        {alquiler.estado.toUpperCase()}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (<td className="p-4 pr-6"><div className="flex items-center justify-end gap-2">{canEdit && <button onClick={() => handleOpenModal(alquiler)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><PencilSimple size={18} /></button>}{canDelete && <button onClick={() => handleDelete(alquiler.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash size={18} /></button>}</div></td>)}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Alquiler" : "Nuevo Alquiler de Línea"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Socio</label>
                  <input type="text" required value={formData.nombre_socio} onChange={(e) => setFormData({...formData, nombre_socio: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Chofer</label>
                  <input type="text" required value={formData.nombre_chofer} onChange={(e) => setFormData({...formData, nombre_chofer: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nº Interno</label>
                  <input type="text" value={formData.numero_interno} onChange={(e) => setFormData({...formData, numero_interno: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto (Bs)</label>
                  <input type="number" step="0.01" required value={formData.monto} onChange={(e) => setFormData({...formData, monto: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
                  <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none">
                    <option value="activo" className="dark:bg-slate-800">Activo</option>
                    <option value="inactivo" className="dark:bg-slate-800">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Línea</label>
                  <select required value={formData.linea_id} onChange={(e) => setFormData({...formData, linea_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none">
                    <option value="" className="text-slate-500 dark:bg-slate-800">Seleccionar...</option>
                    {lineas.map(l => <option key={l.id} value={l.id} className="dark:bg-slate-800">{l.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ruta</label>
                  <select required value={formData.tipo_linea_id} onChange={(e) => setFormData({...formData, tipo_linea_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none">
                    <option value="" className="text-slate-500 dark:bg-slate-800">Seleccionar...</option>
                    {tiposLinea.map(t => <option key={t.id} value={t.id} className="dark:bg-slate-800">{t.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha Inicio</label>
                  <input type="date" required value={formData.fecha_inicio} onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha Fin (Opcional)</label>
                  <input type="date" value={formData.fecha_fin} onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observación</label>
                <textarea rows="2" value={formData.observacion} onChange={(e) => setFormData({...formData, observacion: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"></textarea>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                  Guardar Alquiler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
