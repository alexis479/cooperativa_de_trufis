"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

export default function SociosPage() {
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { permisos } = usePermissions();
  // Validar permisos (asumiendo acceso completo si no hay reglas definidas aún)
  const canEdit = Object.keys(permisos).length === 0 || permisos["socios"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["socios"]?.eliminar === true;

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    ci: "",
    telefono: "",
    numero_interno: "",
    estado: "activo"
  });

  useEffect(() => {
    fetchSocios();
  }, []);

  const fetchSocios = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('socios').select('*').order('numero_interno', { ascending: true });
    if (!error && data) {
      setSocios(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (socio = null) => {
    if (socio) {
      setEditingId(socio.id);
      setFormData({
        nombre: socio.nombre,
        apellido: socio.apellido,
        ci: socio.ci,
        telefono: socio.telefono || "",
        numero_interno: socio.numero_interno || "",
        estado: socio.estado
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: "", apellido: "", ci: "", telefono: "", numero_interno: "", estado: "activo" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('socios').update(formData).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchSocios();
      } else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('socios').insert([formData]);
      if (!error) {
        handleCloseModal();
        fetchSocios();
      } else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este socio?")) {
      const { error } = await supabase.from('socios').delete().eq('id', id);
      if (!error) fetchSocios();
      else alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Socios</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de socios de la cooperativa</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            <Plus size={20} weight="bold" />
            <span>Nuevo Socio</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Nº Interno</th>
                <th className="p-4 uppercase tracking-wider text-xs">Nombre Completo</th>
                <th className="p-4 uppercase tracking-wider text-xs">CI</th>
                <th className="p-4 uppercase tracking-wider text-xs">Contacto</th>
                <th className="p-4 uppercase tracking-wider text-xs">Estado</th>
                {(canEdit || canDelete) && (
                  <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando socios...
                  </td>
                </tr>
              ) : socios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No hay socios registrados.</td>
                </tr>
              ) : (
                socios.map((socio) => (
                  <tr key={socio.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-700 dark:text-slate-300">
                      {socio.numero_interno ? `#${socio.numero_interno}` : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                          {socio.nombre.charAt(0)}{socio.apellido.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">{socio.nombre} {socio.apellido}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{socio.ci}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{socio.telefono || '-'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        socio.estado === 'activo' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        socio.estado === 'inactivo' ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {socio.estado.toUpperCase()}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button onClick={() => handleOpenModal(socio)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                              <PencilSimple size={18} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(socio.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
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

      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Socio" : "Nuevo Socio"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre</label>
                    <input type="text" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Apellido</label>
                    <input type="text" required value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Carnet de Identidad (CI)</label>
                  <input type="text" required value={formData.ci} onChange={(e) => setFormData({...formData, ci: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono</label>
                    <input type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nº de Interno</label>
                    <input type="text" value={formData.numero_interno} onChange={(e) => setFormData({...formData, numero_interno: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" />
                  </div>
                </div>

                {editingId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
                    <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none">
                      <option value="activo" className="dark:bg-slate-800">Activo</option>
                      <option value="inactivo" className="dark:bg-slate-800">Inactivo</option>
                      <option value="suspendido" className="dark:bg-slate-800">Suspendido</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                  Guardar Socio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
