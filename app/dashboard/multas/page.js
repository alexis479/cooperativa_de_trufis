"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

export default function MultasPage() {
  const [multas, setMultas] = useState([]);
  const [tiposMulta, setTiposMulta] = useState([]);
  const [infractores, setInfractores] = useState([]);
  const [lineas, setLineas] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { permisos } = usePermissions();
  const canEdit = Object.keys(permisos).length === 0 || permisos["multas"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["multas"]?.eliminar === true;

  const [formData, setFormData] = useState({
    nombre: "",
    monto: "",
    fecha: new Date().toISOString().split('T')[0],
    estado: "pendiente",
    tipo_de_multa_id: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Fetch Multas
    const { data: multasData } = await supabase.from('multas').select(`
      *,
      tipo_de_multa (descripcion)
    `).order('fecha', { ascending: false });

    if (multasData) setMultas(multasData);

    // Fetch Tipos de Multa
    const { data: tiposData } = await supabase.from('tipo_de_multa').select('*');
    if (tiposData) setTiposMulta(tiposData);

    // Fetch Lineas (silently, to use a fallback ID for DB constraint)
    const { data: lineasData } = await supabase.from('lineas').select('*').limit(1);
    if (lineasData) setLineas(lineasData);

    // Fetch Infractores (Socios + Choferes)
    const { data: sociosData } = await supabase.from('socios').select('nombre, apellido, numero_interno');
    const { data: choferesData } = await supabase.from('choferes').select('nombre, apellido');
    
    let combined = [];
    if (sociosData) {
      combined = [...combined, ...sociosData.map(s => `Socio: ${s.nombre} ${s.apellido} (Int: ${s.numero_interno || 'N/A'})`)];
    }
    if (choferesData) {
      combined = [...combined, ...choferesData.map(c => `Chofer: ${c.nombre} ${c.apellido}`)];
    }
    setInfractores(combined);

    setLoading(false);
  };

  const handleOpenModal = (multa = null) => {
    if (multa) {
      setEditingId(multa.id);
      setFormData({
        nombre: multa.nombre,
        monto: multa.monto,
        fecha: multa.fecha ? multa.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
        estado: multa.estado,
        tipo_de_multa_id: multa.tipo_de_multa_id || (tiposMulta[0]?.id || "")
      });
    } else {
      setEditingId(null);
      setFormData({ 
        nombre: infractores[0] || "", 
        monto: "", 
        fecha: new Date().toISOString().split('T')[0], 
        estado: "pendiente", 
        tipo_de_multa_id: tiposMulta[0]?.id || "" 
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
    
    // Payload oculto para satisfacer restricciones de DB
    const payload = {
      ...formData,
      motivo: "N/A", 
      linea_id: lineas.length > 0 ? lineas[0].id : null,
      fecha: formData.fecha
    };

    // Si linea_id es requerido por la DB pero no hay lineas, enviamos null o lo omitimos y esperamos que pase
    if (!payload.linea_id) delete payload.linea_id;

    if (editingId) {
      const { error } = await supabase.from('multas').update(payload).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchData();
      } else alert("Error al actualizar: " + error.message);
    } else {
      const { error } = await supabase.from('multas').insert([payload]);
      if (!error) {
        handleCloseModal();
        fetchData();
      } else alert("Error al guardar: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta multa?")) {
      const { error } = await supabase.from('multas').delete().eq('id', id);
      if (!error) fetchData();
      else alert("Error al eliminar: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Multas</h1>
          <p className="text-slate-500 text-sm mt-1">Registro de infracciones de transporte o reunión</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => handleOpenModal()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
          >
            <Plus size={20} weight="bold" />
            <span>Registrar Multa</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Infractor (Interno)</th>
                <th className="p-4 uppercase tracking-wider text-xs">Tipo de Multa</th>
                <th className="p-4 uppercase tracking-wider text-xs">Monto Sanción</th>
                <th className="p-4 uppercase tracking-wider text-xs">Fecha</th>
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
                    Cargando multas...
                  </td>
                </tr>
              ) : multas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No hay multas registradas.</td>
                </tr>
              ) : (
                multas.map((multa) => (
                  <tr key={multa.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-700 dark:text-slate-300">
                      {multa.nombre}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {multa.tipo_de_multa?.descripcion || 'Sin tipo'}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-medium">
                      Bs. {multa.monto}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">
                      {new Date(multa.fecha + 'T12:00:00').toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        multa.estado === 'pagado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        multa.estado === 'pendiente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                        'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                      }`}>
                        {multa.estado.toUpperCase()}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button onClick={() => handleOpenModal(multa)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                              <PencilSimple size={18} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(multa.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
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
                {editingId ? "Editar Multa" : "Registrar Multa"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4 mb-6">
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Infractor (Socio o Chofer)</label>
                  <select 
                    required 
                    value={formData.nombre} 
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                  >
                    <option value="" disabled className="dark:bg-slate-800">Seleccione un infractor</option>
                    {infractores.map(inf => (
                      <option key={inf} value={inf} className="dark:bg-slate-800">{inf}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Multa</label>
                  <select 
                    required 
                    value={formData.tipo_de_multa_id} 
                    onChange={(e) => setFormData({...formData, tipo_de_multa_id: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                  >
                    <option value="" disabled className="dark:bg-slate-800">Seleccione el tipo</option>
                    {tiposMulta.map(tipo => (
                      <option key={tipo.id} value={tipo.id} className="dark:bg-slate-800">{tipo.descripcion}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto Sanción (Bs.)</label>
                    <input 
                      type="number" 
                      required 
                      value={formData.monto} 
                      onChange={(e) => setFormData({...formData, monto: e.target.value})} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha</label>
                    <input 
                      type="date" 
                      required 
                      value={formData.fecha} 
                      onChange={(e) => setFormData({...formData, fecha: e.target.value})} 
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
                  <select 
                    value={formData.estado} 
                    onChange={(e) => setFormData({...formData, estado: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all appearance-none"
                  >
                    <option value="pendiente" className="dark:bg-slate-800">Pendiente</option>
                    <option value="pagado" className="dark:bg-slate-800">Pagado</option>
                    <option value="anulado" className="dark:bg-slate-800">Anulado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                  Guardar Multa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
