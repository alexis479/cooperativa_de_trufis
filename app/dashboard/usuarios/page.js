"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { createClient } from "@supabase/supabase-js";
import { Plus, PencilSimple, Trash, X, UserGear } from "@phosphor-icons/react";

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    contraseña: "",
    rol_id: ""
  });

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .order('id', { ascending: false });
      
    if (!error && data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase.from('roles').select('id, nombre');
    if (!error && data) setRoles(data);
  };

  const handleOpenModal = (usuario = null) => {
    if (usuario) {
      setEditingId(usuario.id);
      setFormData({
        nombre: usuario.nombre,
        correo: usuario.correo,
        contraseña: usuario.contraseña,
        rol_id: usuario.rol_id || ""
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: "", correo: "", contraseña: "", rol_id: "" });
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
      const { error } = await supabase.from('usuarios').update(formData).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchUsuarios();
      } else alert("Error: " + error.message);
    } else {
      // 1. Crear el usuario en la Autenticación de Supabase (sin cerrar la sesión del admin)
      // Creamos un cliente temporal que no guarda la sesión en la memoria del navegador
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        { auth: { persistSession: false } }
      );

      const { data: authData, error: authError } = await authClient.auth.signUp({
        email: formData.correo,
        password: formData.contraseña,
      });

      if (authError) {
        alert("No se pudo registrar la seguridad del usuario: " + authError.message);
        return;
      }

      // 2. Si se creó en Auth, lo guardamos en la tabla pública de usuarios
      const { error: dbError } = await supabase.from('usuarios').insert([{
        nombre: formData.nombre,
        correo: formData.correo,
        contraseña: formData.contraseña,
        rol_id: formData.rol_id
      }]);

      if (!dbError) {
        handleCloseModal();
        fetchUsuarios();
        alert("¡Éxito! El usuario ha sido creado y ya puede iniciar sesión inmediatamente en la plataforma.");
      } else {
        alert("El usuario se creó en Auth pero hubo un error en la tabla: " + dbError.message);
      }
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const { error } = await supabase.from('usuarios').delete().eq('id', deleteConfirmId);
      if (error) {
        console.error("Error BD:", error);
        alert("No se pudo eliminar el usuario: " + error.message);
      } else {
        await fetchUsuarios();
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error("Error JS:", err);
      alert("Error crítico: " + err.message);
    }
  };

  const handleDeleteClick = (id) => {
    if (id === 1) {
      alert("No se puede eliminar al Administrador principal.");
      return;
    }
    setDeleteConfirmId(id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Usuarios del Sistema</h1>
          <p className="text-slate-500 text-sm mt-1">Administra los usuarios con acceso al panel y sus roles</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
        >
          <Plus size={20} weight="bold" />
          <span>Nuevo Usuario</span>
        </button>
      </div>


      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Usuario</th>
                <th className="p-4 uppercase tracking-wider text-xs">Correo Electrónico</th>
                <th className="p-4 uppercase tracking-wider text-xs">Rol Asignado</th>
                <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">No hay usuarios registrados.</td>
                </tr>
              ) : (
                usuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
                          {usuario.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{usuario.nombre}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{usuario.correo}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">
                        {usuario.roles ? usuario.roles.nombre : 'Sin Rol'}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(usuario)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                          <PencilSimple size={18} />
                        </button>
                        {usuario.id !== 1 && (
                          <button 
                            onClick={() => handleDeleteClick(usuario.id)}
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
                {editingId ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre Completo</label>
                <input 
                  type="text" 
                  required 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" 
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Correo Electrónico</label>
                <input 
                  type="email" 
                  required 
                  value={formData.correo} 
                  onChange={(e) => setFormData({...formData, correo: e.target.value})} 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" 
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Contraseña</label>
                <input 
                  type="text" 
                  required 
                  value={formData.contraseña} 
                  onChange={(e) => setFormData({...formData, contraseña: e.target.value})} 
                  placeholder="Se guardará en texto plano en esta tabla" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500" 
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rol del Usuario</label>
                <select 
                  required 
                  value={formData.rol_id} 
                  onChange={(e) => setFormData({...formData, rol_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none"
                >
                  <option value="" className="text-slate-500 dark:bg-slate-800">Seleccionar Rol...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id} className="dark:bg-slate-800">{r.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash size={32} weight="fill" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">¿Eliminar Usuario?</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
              Esta acción eliminará al usuario de esta tabla. No borrará su cuenta en Authentication de Supabase (debes hacerlo manualmente).
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20 transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
