"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, ShieldCheck } from "@phosphor-icons/react";

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    permisos_json: "" // Mantendremos los permisos como un texto JSON por ahora
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('roles').select('*').order('id', { ascending: true });
    if (!error && data) {
      setRoles(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (rol = null) => {
    if (rol) {
      setEditingId(rol.id);
      setFormData({
        nombre: rol.nombre,
        permisos_json: rol.permisos_json || "{}"
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: "", permisos_json: "{}" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validar JSON básico
    try {
      JSON.parse(formData.permisos_json);
    } catch (e) {
      alert("El formato de permisos JSON es inválido.");
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('roles').update(formData).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchRoles();
      } else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('roles').insert([formData]);
      if (!error) {
        handleCloseModal();
        fetchRoles();
      } else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (id === 1) {
      alert("No se puede eliminar el rol de Administrador principal.");
      return;
    }
    if (confirm("¿Estás seguro de que deseas eliminar este rol? Se desvinculará de los usuarios asociados.")) {
      const { error } = await supabase.from('roles').delete().eq('id', id);
      if (!error) fetchRoles();
      else alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Roles y Permisos</h1>
          <p className="text-slate-500 text-sm mt-1">Configuración de niveles de acceso del sistema</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 hover:-translate-y-0.5"
        >
          <Plus size={20} weight="bold" />
          <span>Nuevo Rol</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">ID</th>
                <th className="p-4 uppercase tracking-wider text-xs">Nombre del Rol</th>
                <th className="p-4 uppercase tracking-wider text-xs">Permisos (JSON)</th>
                <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando roles...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No hay roles registrados.</td>
                </tr>
              ) : (
                roles.map((rol) => (
                  <tr key={rol.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6 text-slate-500 font-medium">#{rol.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                        <ShieldCheck size={20} className="text-amber-500" />
                        {rol.nombre}
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-xs bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 p-2 rounded-lg truncate block max-w-xs">
                        {rol.permisos_json || "{}"}
                      </code>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(rol)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                          <PencilSimple size={18} />
                        </button>
                        {rol.id !== 1 && (
                          <button 
                            onClick={() => handleDelete(rol.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <Trash size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Rol" : "Nuevo Rol"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Rol</label>
                <input 
                  type="text" 
                  required 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Secretario" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" 
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Permisos (Formato JSON)</label>
                <textarea 
                  rows="4" 
                  required
                  value={formData.permisos_json} 
                  onChange={(e) => setFormData({...formData, permisos_json: e.target.value})} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 font-mono text-sm"
                ></textarea>
                <p className="text-xs text-slate-500 mt-2">Ejemplo: {`{"socios": true, "gastos": false}`}</p>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/20">
                  Guardar Rol
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
