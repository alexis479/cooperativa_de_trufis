"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, WarningCircle } from "@phosphor-icons/react";

export default function MultasPage() {
  const [multas, setMultas] = useState([]);
  const [tiposMulta, setTiposMulta] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nombre: "",
    motivo: "",
    monto: "",
    fecha: new Date().toISOString().split('T')[0],
    estado: "pendiente",
    tipo_de_multa_id: "",
    linea_id: ""
  });

  useEffect(() => {
    fetchMultas();
    fetchRelaciones();
  }, []);

  const fetchMultas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('multas')
      .select('*, tipo_de_multa(descripcion), lineas(nombre)')
      .order('fecha', { ascending: false });
      
    if (!error && data) {
      setMultas(data);
    }
    setLoading(false);
  };

  const fetchRelaciones = async () => {
    const { data: tipos } = await supabase.from('tipo_de_multa').select('*');
    if (tipos) setTiposMulta(tipos);

    const { data: lin } = await supabase.from('lineas').select('*');
    if (lin) setLineas(lin);
  };

  const handleOpenModal = (multa = null) => {
    if (multa) {
      setEditingId(multa.id);
      setFormData({
        nombre: multa.nombre,
        motivo: multa.motivo,
        monto: multa.monto,
        fecha: multa.fecha,
        estado: multa.estado,
        tipo_de_multa_id: multa.tipo_de_multa_id,
        linea_id: multa.linea_id
      });
    } else {
      setEditingId(null);
      setFormData({ 
        nombre: "", motivo: "", monto: "", 
        fecha: new Date().toISOString().split('T')[0], 
        estado: "pendiente", tipo_de_multa_id: "", linea_id: "" 
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  // Cuando cambia el tipo de multa, sugerir monto si no está puesto
  const handleTipoMultaChange = (e) => {
    const tId = e.target.value;
    const tipoSelec = tiposMulta.find(t => t.id.toString() === tId);
    let nuevoMonto = formData.monto;
    
    // Auto-llenar monto si está vacío como ejemplo de utilidad (usaremos multa_reunion como base)
    if (tipoSelec && !nuevoMonto) {
      nuevoMonto = tipoSelec.multa_reunion; 
    }

    setFormData({
      ...formData,
      tipo_de_multa_id: tId,
      motivo: tipoSelec ? tipoSelec.descripcion : formData.motivo,
      monto: nuevoMonto
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.tipo_de_multa_id || !formData.linea_id) {
      alert("Seleccione el Tipo de Multa y la Línea.");
      return;
    }

    const payload = {
      ...formData,
      monto: parseFloat(formData.monto)
    };

    if (editingId) {
      const { error } = await supabase.from('multas').update(payload).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchMultas();
      } else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('multas').insert([payload]);
      if (!error) {
        handleCloseModal();
        fetchMultas();
      } else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Deseas eliminar permanentemente esta multa?")) {
      const { error } = await supabase.from('multas').delete().eq('id', id);
      if (!error) fetchMultas();
      else alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Multas e Infracciones</h1>
          <p className="text-slate-500 text-sm mt-1">Sanciones aplicadas a socios o choferes de la cooperativa</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5"
        >
          <Plus size={20} weight="bold" />
          <span>Registrar Multa</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Fecha / Infractor</th>
                <th className="p-4 uppercase tracking-wider text-xs">Tipo / Motivo</th>
                <th className="p-4 uppercase tracking-wider text-xs">Línea</th>
                <th className="p-4 uppercase tracking-wider text-xs">Monto (Bs)</th>
                <th className="p-4 uppercase tracking-wider text-xs">Estado</th>
                <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
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
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{multa.nombre}</span>
                        <span className="text-xs text-slate-500">{new Date(multa.fecha).toLocaleDateString('es-ES')}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {multa.tipo_de_multa ? multa.tipo_de_multa.descripcion : 'General'}
                        </span>
                        <span className="text-xs text-slate-500">{multa.motivo}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      {multa.lineas ? multa.lineas.nombre : '-'}
                    </td>
                    <td className="p-4 font-bold text-orange-600 dark:text-orange-400">
                      Bs. {parseFloat(multa.monto).toLocaleString('es-BO')}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        multa.estado === 'pendiente' ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                        multa.estado === 'pagado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {multa.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(multa)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                          <PencilSimple size={18} />
                        </button>
                        <button onClick={() => handleDelete(multa.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Multa" : "Nueva Multa"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre (Infractor)</label>
                  <input type="text" required value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Socio o Chofer..." className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Multa</label>
                  <select required value={formData.tipo_de_multa_id} onChange={handleTipoMultaChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 appearance-none">
                    <option value="" className="text-slate-500 dark:bg-slate-800">Seleccionar Tipo...</option>
                    {tiposMulta.map(t => (
                      <option key={t.id} value={t.id} className="dark:bg-slate-800">{t.descripcion}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Motivo de Infracción</label>
                <input type="text" required value={formData.motivo} onChange={(e) => setFormData({...formData, motivo: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500" />
              </div>

              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Línea de Infracción</label>
                  <select required value={formData.linea_id} onChange={(e) => setFormData({...formData, linea_id: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 appearance-none">
                    <option value="" className="text-slate-500 dark:bg-slate-800">Seleccionar Línea...</option>
                    {lineas.map(l => <option key={l.id} value={l.id} className="dark:bg-slate-800">{l.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto Sanción (Bs)</label>
                  <input type="number" step="0.01" required value={formData.monto} onChange={(e) => setFormData({...formData, monto: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha</label>
                  <input type="date" required value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
                  <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 appearance-none">
                    <option value="pendiente" className="dark:bg-slate-800">Pendiente (Deuda)</option>
                    <option value="pagado" className="dark:bg-slate-800">Pagado</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-lg shadow-orange-500/20">
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
