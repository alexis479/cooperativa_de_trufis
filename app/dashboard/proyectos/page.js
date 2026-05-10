"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, Briefcase } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

export default function ProyectosPage() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { permisos } = usePermissions();
  const canEdit = Object.keys(permisos).length === 0 || permisos["proyectos"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["proyectos"]?.eliminar === true;

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: "",
    presupuesto: "",
    estado: "en_proceso"
  });

  useEffect(() => { fetchProyectos(); }, []);

  const fetchProyectos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('proyectos').select('*').order('fecha_inicio', { ascending: false });
    if (!error && data) setProyectos(data);
    setLoading(false);
  };

  const handleOpenModal = (proyecto = null) => {
    if (proyecto) {
      setEditingId(proyecto.id);
      setFormData({
        nombre: proyecto.nombre,
        descripcion: proyecto.descripcion || "",
        fecha_inicio: proyecto.fecha_inicio ? proyecto.fecha_inicio.split('T')[0] : "",
        fecha_fin: proyecto.fecha_fin ? proyecto.fecha_fin.split('T')[0] : "",
        presupuesto: proyecto.presupuesto || "",
        estado: proyecto.estado || "en_proceso"
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: "", descripcion: "", fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: "", presupuesto: "", estado: "en_proceso" });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData };
    if (!payload.fecha_fin) delete payload.fecha_fin;

    if (editingId) {
      const { error } = await supabase.from('proyectos').update(payload).eq('id', editingId);
      if (!error) { setIsModalOpen(false); fetchProyectos(); }
      else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('proyectos').insert([payload]);
      if (!error) { setIsModalOpen(false); fetchProyectos(); }
      else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Eliminar este proyecto?")) {
      const { error } = await supabase.from('proyectos').delete().eq('id', id);
      if (!error) fetchProyectos();
      else alert("Error: " + error.message);
    }
  };

  const estadoConfig = {
    en_proceso: { label: "En Proceso", cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
    completado: { label: "Completado", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" },
    cancelado: { label: "Cancelado", cls: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400" },
    pendiente: { label: "Pendiente", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" },
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Proyectos</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de proyectos e iniciativas de la cooperativa</p>
        </div>
        {canEdit && (
          <button onClick={() => handleOpenModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
            <Plus size={20} weight="bold" />
            <span>Nuevo Proyecto</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : proyectos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Briefcase size={48} className="mb-3 opacity-30" />
          <p className="font-medium">No hay proyectos registrados</p>
          <p className="text-sm mt-1">Haz clic en "Nuevo Proyecto" para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {proyectos.map((proyecto) => {
            const cfg = estadoConfig[proyecto.estado] || estadoConfig.pendiente;
            const progress = proyecto.fecha_inicio && proyecto.fecha_fin
              ? Math.min(100, Math.max(0, Math.round(
                  (new Date() - new Date(proyecto.fecha_inicio)) /
                  (new Date(proyecto.fecha_fin) - new Date(proyecto.fecha_inicio)) * 100
                )))
              : null;

            return (
              <div key={proyecto.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>{cfg.label}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight">{proyecto.nombre}</h3>
                  {proyecto.descripcion && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{proyecto.descripcion}</p>}
                </div>

                {proyecto.presupuesto && (
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl px-4 py-2.5">
                    <p className="text-xs text-slate-500 mb-0.5">Presupuesto</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">Bs. {Number(proyecto.presupuesto).toLocaleString()}</p>
                  </div>
                )}

                <div className="flex gap-3 text-xs text-slate-500">
                  {proyecto.fecha_inicio && (
                    <span>Inicio: <strong className="text-slate-700 dark:text-slate-300">{new Date(proyecto.fecha_inicio).toLocaleDateString()}</strong></span>
                  )}
                  {proyecto.fecha_fin && (
                    <span>Fin: <strong className="text-slate-700 dark:text-slate-300">{new Date(proyecto.fecha_fin).toLocaleDateString()}</strong></span>
                  )}
                </div>

                {progress !== null && proyecto.estado === 'en_proceso' && (
                  <div>
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>Progreso estimado</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}

                {(canEdit || canDelete) && (
                  <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    {canEdit && (
                      <button onClick={() => handleOpenModal(proyecto)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                        <PencilSimple size={16} /> Editar
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDelete(proyecto.id)} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors">
                        <Trash size={16} /> Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">{editingId ? "Editar Proyecto" : "Nuevo Proyecto"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Proyecto</label>
                <input type="text" required value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción</label>
                <textarea rows={3} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de Inicio</label>
                  <input type="date" required value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha de Fin</label>
                  <input type="date" value={formData.fecha_fin} onChange={e => setFormData({...formData, fecha_fin: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Presupuesto (Bs.)</label>
                  <input type="number" step="0.01" value={formData.presupuesto} onChange={e => setFormData({...formData, presupuesto: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none">
                    <option value="pendiente" className="dark:bg-slate-800">Pendiente</option>
                    <option value="en_proceso" className="dark:bg-slate-800">En Proceso</option>
                    <option value="completado" className="dark:bg-slate-800">Completado</option>
                    <option value="cancelado" className="dark:bg-slate-800">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all">Guardar Proyecto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
