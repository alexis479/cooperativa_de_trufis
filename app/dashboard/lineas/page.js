"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, MapPinLine } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

export default function LineasPage() {
  const [lineas, setLineas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { permisos } = usePermissions();
  const canEdit = Object.keys(permisos).length === 0 || permisos["lineas"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["lineas"]?.eliminar === true;

  const [formData, setFormData] = useState({
    nombre_ruta: "",
    nombre: "",
    descripcion: ""
  });

  useEffect(() => {
    fetchLineas();
  }, []);

  const fetchLineas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tipo_de_linea')
      .select('*')
      .order('id', { ascending: true });

    if (!error && data) setLineas(data);
    setLoading(false);
  };

  const handleOpenModal = (linea = null) => {
    if (linea) {
      setEditingId(linea.id);
      setFormData({
        nombre_ruta: linea.nombre_ruta || "",
        nombre: linea.nombre || "",
        descripcion: linea.descripcion || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre_ruta: "",
        nombre: "",
        descripcion: ""
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

    const payload = {
      nombre_ruta: formData.nombre_ruta,
      nombre: formData.nombre || null,
      descripcion: formData.descripcion || null
    };

    if (editingId) {
      const { error } = await supabase.from('tipo_de_linea').update(payload).eq('id', editingId);
      if (!error) { handleCloseModal(); fetchLineas(); }
      else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('tipo_de_linea').insert([payload]);
      if (!error) { handleCloseModal(); fetchLineas(); }
      else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta línea/ruta? Podría estar asignada a alquileres existentes.")) {
      const { error } = await supabase.from('tipo_de_linea').delete().eq('id', id);
      if (!error) fetchLineas();
      else alert("Error al eliminar: Es posible que esta ruta esté en uso por otros registros.\nDetalle: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Líneas / Rutas</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de las rutas disponibles en la cooperativa</p>
        </div>
        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            <Plus size={20} weight="bold" />
            <span>Nueva Ruta</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs w-24">ID</th>
                <th className="p-4 uppercase tracking-wider text-xs">Nombre Ruta</th>
                <th className="p-4 uppercase tracking-wider text-xs">Nombre Corto</th>
                <th className="p-4 uppercase tracking-wider text-xs">Descripción</th>
                {(canEdit || canDelete) && <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando rutas...
                  </td>
                </tr>
              ) : lineas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No hay rutas registradas.</td>
                </tr>
              ) : (
                lineas.map((linea) => (
                  <tr key={linea.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6 text-slate-500 font-medium">#{linea.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                        <MapPinLine size={20} className="text-emerald-500" />
                        {linea.nombre_ruta}
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                      {linea.nombre || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {linea.descripcion || '-'}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button onClick={() => handleOpenModal(linea)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                              <PencilSimple size={18} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(linea.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                              <Trash size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Ruta" : "Nueva Ruta"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre Completo de la Ruta <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_ruta}
                  onChange={(e) => setFormData({...formData, nombre_ruta: e.target.value})}
                  placeholder="Ej: Ruta Abasto, Todas las rutas..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre Corto / Alias
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  placeholder="Ej: Abasto"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción</label>
                <textarea
                  rows="2"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  placeholder="Detalles adicionales (opcional)..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-slate-700 mt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
