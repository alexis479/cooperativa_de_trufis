"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, ShieldCheck, Check, Info } from "@phosphor-icons/react";

// Lista de todos los módulos del sistema
const MODULOS = [
  { id: "socios", nombre: "Socios" },
  { id: "choferes", nombre: "Choferes" },
  { id: "vehiculos", nombre: "Vehículos" },
  { id: "aportes", nombre: "Aportes" },
  { id: "alquileres", nombre: "Alquiler de Líneas" },
  { id: "gastos", nombre: "Gastos" },
  { id: "prestamos", nombre: "Préstamos" },
  { id: "asistencias", nombre: "Asistencia a Reunión" },
  { id: "multas", nombre: "Multas" },
  { id: "usuarios", nombre: "Usuarios" },
  { id: "roles", nombre: "Roles y Permisos" }
];

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: ""
  });

  // Estado estructurado para los permisos: { "socios": { ver: true, editar: true, eliminar: false }, ... }
  const [permisos, setPermisos] = useState({});

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

  // Inicializa los permisos en falso
  const initializePermisos = () => {
    const init = {};
    MODULOS.forEach(m => {
      init[m.id] = { ver: false, editar: false, eliminar: false };
    });
    return init;
  };

  const handleOpenModal = (rol = null) => {
    if (rol) {
      setEditingId(rol.id);
      setFormData({ nombre: rol.nombre });
      
      try {
        // Cargar los permisos del JSON, y combinarlos con la plantilla inicial por si hay módulos nuevos
        const parsed = JSON.parse(rol.permisos_json || "{}");
        const init = initializePermisos();
        Object.keys(init).forEach(mod => {
          if (parsed[mod]) {
            init[mod] = { ...init[mod], ...parsed[mod] };
          }
        });
        setPermisos(init);
      } catch (e) {
        setPermisos(initializePermisos());
      }
    } else {
      setEditingId(null);
      setFormData({ nombre: "" });
      setPermisos(initializePermisos());
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleTogglePermiso = (modulo, accion) => {
    setPermisos(prev => {
      const nuevoEstado = { ...prev };
      
      // Si se activa editar o eliminar, automáticamente se activa "ver"
      if ((accion === "editar" || accion === "eliminar") && !nuevoEstado[modulo][accion]) {
        nuevoEstado[modulo].ver = true;
      }
      
      // Si se desactiva "ver", se desactivan "editar" y "eliminar"
      if (accion === "ver" && nuevoEstado[modulo].ver) {
        nuevoEstado[modulo].editar = false;
        nuevoEstado[modulo].eliminar = false;
      }

      nuevoEstado[modulo][accion] = !nuevoEstado[modulo][accion];
      return nuevoEstado;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Guardamos todo el objeto de permisos como un string JSON
    const payload = {
      nombre: formData.nombre,
      permisos_json: JSON.stringify(permisos)
    };

    if (editingId) {
      const { error } = await supabase.from('roles').update(payload).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchRoles();
      } else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('roles').insert([payload]);
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

  // Pequeño componente visual para el Toggle Switch
  const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <button
      type="button"
      onClick={disabled ? null : onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-1'}`} />
    </button>
  );

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
                <th className="p-4 pl-6 uppercase tracking-wider text-xs w-24">ID</th>
                <th className="p-4 uppercase tracking-wider text-xs">Nombre del Rol</th>
                <th className="p-4 uppercase tracking-wider text-xs">Módulos con Acceso</th>
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
                roles.map((rol) => {
                  let parsed = {};
                  try { parsed = JSON.parse(rol.permisos_json || "{}"); } catch(e) {}
                  
                  // Contar a cuántos módulos tiene acceso (al menos ver)
                  const modulosAcceso = Object.values(parsed).filter(p => p.ver).length;

                  return (
                    <tr key={rol.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="p-4 pl-6 text-slate-500 font-medium">#{rol.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                          <ShieldCheck size={20} className="text-amber-500" />
                          {rol.nombre}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-medium">
                          Tiene acceso a {modulosAcceso} módulos
                        </span>
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
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Rol y Permisos" : "Nuevo Rol"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col overflow-hidden">
              <div className="p-6 pb-2 shrink-0">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Rol</label>
                <input 
                  type="text" 
                  required 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej: Cajero, Inspector, etc." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" 
                />
              </div>

              <div className="p-6 pt-4 flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
                  <Info size={18} />
                  <span className="text-sm font-medium">Configura qué módulos y acciones puede realizar este rol:</span>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">Módulo</th>
                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 text-center uppercase">Ver (Leer)</th>
                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 text-center uppercase">Crear / Editar</th>
                        <th className="p-3 text-xs font-semibold text-slate-600 dark:text-slate-400 text-center uppercase">Eliminar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MODULOS.map((mod, index) => (
                        <tr key={mod.id} className={index !== MODULOS.length - 1 ? "border-b border-slate-100 dark:border-slate-700/50" : ""}>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-200 text-sm">
                            {mod.nombre}
                          </td>
                          <td className="p-3 text-center">
                            <ToggleSwitch 
                              checked={permisos[mod.id]?.ver} 
                              onChange={() => handleTogglePermiso(mod.id, 'ver')} 
                            />
                          </td>
                          <td className="p-3 text-center">
                            <ToggleSwitch 
                              checked={permisos[mod.id]?.editar} 
                              onChange={() => handleTogglePermiso(mod.id, 'editar')} 
                            />
                          </td>
                          <td className="p-3 text-center">
                            <ToggleSwitch 
                              checked={permisos[mod.id]?.eliminar} 
                              onChange={() => handleTogglePermiso(mod.id, 'eliminar')} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/20 transition-all">
                  Guardar Permisos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
