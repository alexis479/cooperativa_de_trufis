"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";

export default function ChoferesPage() {
  const [choferes, setChoferes] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    ci: "",
    telefono: "",
    socio_id: ""
  });

  useEffect(() => {
    fetchChoferes();
    fetchSocios();
  }, []);

  const fetchChoferes = async () => {
    setLoading(true);
    // Hacemos un join con la tabla socios para obtener el nombre
    const { data, error } = await supabase
      .from('choferes')
      .select('*, socios(nombre, apellido)')
      .order('id', { ascending: false });
      
    if (!error && data) {
      setChoferes(data);
    }
    setLoading(false);
  };

  const fetchSocios = async () => {
    const { data, error } = await supabase.from('socios').select('id, nombre, apellido').order('nombre');
    if (!error && data) {
      setSocios(data);
    }
  };

  const handleOpenModal = (chofer = null) => {
    if (chofer) {
      setEditingId(chofer.id);
      setFormData({
        nombre: chofer.nombre,
        apellido: chofer.apellido,
        ci: chofer.ci,
        telefono: chofer.telefono || "",
        socio_id: chofer.socio_id
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: "", apellido: "", ci: "", telefono: "", socio_id: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.socio_id) {
      alert("Debes seleccionar un socio al cual asignar el chofer.");
      return;
    }

    // Buscamos el nombre del socio seleccionado para guardarlo en 'nombre_socio' (por retrocompatibilidad con BD vieja)
    const socioSeleccionado = socios.find(s => s.id.toString() === formData.socio_id.toString());
    const nombreSocioStr = socioSeleccionado ? `${socioSeleccionado.nombre} ${socioSeleccionado.apellido}` : '';

    const payload = {
      ...formData,
      nombre_socio: nombreSocioStr
    };

    if (editingId) {
      const { error } = await supabase.from('choferes').update(payload).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchChoferes();
      } else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('choferes').insert([payload]);
      if (!error) {
        handleCloseModal();
        fetchChoferes();
      } else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este chofer?")) {
      const { error } = await supabase.from('choferes').delete().eq('id', id);
      if (!error) fetchChoferes();
      else alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestión de Choferes</h1>
          <p className="text-slate-500 text-sm mt-1">Registra y administra los choferes de relevo</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5"
        >
          <Plus size={20} weight="bold" />
          <span>Nuevo Chofer</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Nombre del Chofer</th>
                <th className="p-4 uppercase tracking-wider text-xs">Carnet (CI)</th>
                <th className="p-4 uppercase tracking-wider text-xs">Teléfono</th>
                <th className="p-4 uppercase tracking-wider text-xs">Socio Asignado</th>
                <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando choferes...
                  </td>
                </tr>
              ) : choferes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No hay choferes registrados.
                  </td>
                </tr>
              ) : (
                choferes.map((chofer) => (
                  <tr key={chofer.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6 font-medium text-slate-900 dark:text-slate-100">
                      {chofer.nombre} {chofer.apellido}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{chofer.ci}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{chofer.telefono || '-'}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm">
                        {chofer.socios ? `${chofer.socios.nombre} ${chofer.socios.apellido}` : chofer.nombre_socio}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(chofer)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                        >
                          <PencilSimple size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(chofer.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <Trash size={18} />
                        </button>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Chofer" : "Nuevo Chofer"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre</label>
                  <input type="text" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Apellido</label>
                  <input type="text" required value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Carnet (CI)</label>
                  <input type="text" required value={formData.ci} onChange={(e) => setFormData({...formData, ci: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono</label>
                  <input type="text" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Socio Asignado</label>
                <select 
                  required 
                  value={formData.socio_id} 
                  onChange={(e) => setFormData({...formData, socio_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 appearance-none"
                >
                  <option value="" className="text-slate-500 dark:bg-slate-800">Seleccionar Socio...</option>
                  {socios.map(s => (
                    <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.nombre} {s.apellido}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                  Guardar Chofer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
