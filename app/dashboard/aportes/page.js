"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, Money } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

export default function AportesPage() {
  const [aportes, setAportes] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { permisos } = usePermissions();
  const canEdit = Object.keys(permisos).length === 0 || permisos["aportes"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["aportes"]?.eliminar === true;

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    motivo: "",
    monto: "",
    socio_id: ""
  });

  useEffect(() => {
    fetchAportes();
    fetchSocios();
  }, []);

  const fetchAportes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('aportes')
      .select('*, socios(nombre, apellido, numero_interno)')
      .order('fecha', { ascending: false });
      
    if (!error && data) {
      setAportes(data);
    }
    setLoading(false);
  };

  const fetchSocios = async () => {
    const { data, error } = await supabase.from('socios').select('id, nombre, apellido, numero_interno').order('nombre');
    if (!error && data) {
      setSocios(data);
    }
  };

  const handleOpenModal = (aporte = null) => {
    if (aporte) {
      setEditingId(aporte.id);
      setFormData({
        fecha: aporte.fecha,
        motivo: aporte.motivo,
        monto: aporte.monto,
        socio_id: aporte.socio_id
      });
    } else {
      setEditingId(null);
      setFormData({ 
        fecha: new Date().toISOString().split('T')[0], 
        motivo: "", 
        monto: "", 
        socio_id: "" 
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
    
    if (!formData.socio_id) {
      alert("Debes seleccionar el socio que realiza el aporte.");
      return;
    }

    const payload = {
      ...formData,
      monto: parseFloat(formData.monto)
    };

    if (editingId) {
      const { error } = await supabase.from('aportes').update(payload).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchAportes();
      } else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('aportes').insert([payload]);
      if (!error) {
        handleCloseModal();
        fetchAportes();
      } else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este aporte?")) {
      const { error } = await supabase.from('aportes').delete().eq('id', id);
      if (!error) fetchAportes();
      else alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Registro de Aportes</h1>
          <p className="text-slate-500 text-sm mt-1">Control de aportes económicos de los socios</p>
        </div>
        {canEdit && (
          <button onClick={() => handleOpenModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
            <Plus size={20} weight="bold" /><span>Nuevo Aporte</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Fecha</th>
                <th className="p-4 uppercase tracking-wider text-xs">Socio (Nº Interno)</th>
                <th className="p-4 uppercase tracking-wider text-xs">Motivo</th>
                <th className="p-4 uppercase tracking-wider text-xs">Monto (Bs)</th>
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
                    Cargando aportes...
                  </td>
                </tr>
              ) : aportes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No hay aportes registrados.
                  </td>
                </tr>
              ) : (
                aportes.map((aporte) => (
                  <tr key={aporte.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6 font-medium text-slate-600 dark:text-slate-400">
                      {new Date(aporte.fecha).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-4">
                      {aporte.socios ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {aporte.socios.nombre} {aporte.socios.apellido}
                          </span>
                          <span className="text-xs text-slate-500">Interno: {aporte.socios.numero_interno}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Socio no encontrado</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 capitalize">{aporte.motivo}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                        <Money size={20} />
                        Bs. {parseFloat(aporte.monto).toLocaleString('es-BO', {minimumFractionDigits: 2})}
                      </div>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && <button onClick={() => handleOpenModal(aporte)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><PencilSimple size={18} /></button>}
                          {canDelete && <button onClick={() => handleDelete(aporte.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash size={18} /></button>}
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
                {editingId ? "Editar Aporte" : "Nuevo Aporte"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Socio que aporta</label>
                <select 
                  required 
                  value={formData.socio_id} 
                  onChange={(e) => setFormData({...formData, socio_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 appearance-none"
                >
                  <option value="" className="text-slate-500 dark:bg-slate-800">Seleccionar Socio...</option>
                  {socios.map(s => (
                    <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.nombre} {s.apellido} (Nº {s.numero_interno})</option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Motivo del Aporte</label>
                <input 
                  type="text" 
                  required 
                  value={formData.motivo} 
                  onChange={(e) => setFormData({...formData, motivo: e.target.value})} 
                  placeholder="Ej: Aporte mensual, Cuota extraordinaria..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-5 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.fecha} 
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto (Bs.)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    required 
                    value={formData.monto} 
                    onChange={(e) => setFormData({...formData, monto: e.target.value})} 
                    placeholder="0.00" 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" 
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                  Guardar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
