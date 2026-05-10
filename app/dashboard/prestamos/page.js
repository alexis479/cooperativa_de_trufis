"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, HandCoins } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

export default function PrestamosPage() {
  const [prestamos, setPrestamos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { permisos } = usePermissions();
  const canEdit = Object.keys(permisos).length === 0 || permisos["prestamos"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["prestamos"]?.eliminar === true;

  const [formData, setFormData] = useState({
    socio_id: "",
    monto: "",
    cuotas: 1,
    interes: 0,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: "",
    estado: "activo"
  });

  useEffect(() => {
    fetchPrestamos();
    fetchSocios();
  }, []);

  const fetchPrestamos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('prestamos')
      .select('*, socios(nombre, apellido, numero_interno)')
      .order('fecha_inicio', { ascending: false });
      
    if (!error && data) {
      setPrestamos(data);
    }
    setLoading(false);
  };

  const fetchSocios = async () => {
    const { data, error } = await supabase.from('socios').select('id, nombre, apellido, numero_interno').order('nombre');
    if (!error && data) {
      setSocios(data);
    }
  };

  const handleOpenModal = (prestamo = null) => {
    if (prestamo) {
      setEditingId(prestamo.id);
      setFormData({
        socio_id: prestamo.socio_id,
        monto: prestamo.monto,
        cuotas: prestamo.cuotas,
        interes: prestamo.interes,
        fecha_inicio: prestamo.fecha_inicio,
        fecha_fin: prestamo.fecha_fin || "",
        estado: prestamo.estado
      });
    } else {
      setEditingId(null);
      setFormData({ 
        socio_id: "", 
        monto: "", 
        cuotas: 1, 
        interes: 0, 
        fecha_inicio: new Date().toISOString().split('T')[0], 
        fecha_fin: "", 
        estado: "activo" 
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
      alert("Debes seleccionar el socio que recibe el préstamo.");
      return;
    }

    const payload = {
      ...formData,
      monto: parseFloat(formData.monto),
      cuotas: parseInt(formData.cuotas, 10),
      interes: parseFloat(formData.interes),
      fecha_fin: formData.fecha_fin ? formData.fecha_fin : null
    };

    if (editingId) {
      const { error } = await supabase.from('prestamos').update(payload).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchPrestamos();
      } else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('prestamos').insert([payload]);
      if (!error) {
        handleCloseModal();
        fetchPrestamos();
      } else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este préstamo?")) {
      const { error } = await supabase.from('prestamos').delete().eq('id', id);
      if (!error) fetchPrestamos();
      else alert("Error: " + error.message);
    }
  };

  // Calcula monto total a pagar
  const calcularTotalPagar = (monto, interes) => {
    const pMonto = parseFloat(monto) || 0;
    const pInteres = parseFloat(interes) || 0;
    return pMonto + (pMonto * (pInteres / 100));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Préstamos</h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de préstamos internos a socios</p>
        </div>
        {canEdit && (
          <button onClick={() => handleOpenModal()} className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5">
            <Plus size={20} weight="bold" /><span>Nuevo Préstamo</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Socio</th>
                <th className="p-4 uppercase tracking-wider text-xs">Condiciones</th>
                <th className="p-4 uppercase tracking-wider text-xs">Total a Pagar</th>
                <th className="p-4 uppercase tracking-wider text-xs">Fechas</th>
                <th className="p-4 uppercase tracking-wider text-xs">Estado</th>
                {(canEdit || canDelete) && <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando préstamos...
                  </td>
                </tr>
              ) : prestamos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">No hay préstamos registrados.</td>
                </tr>
              ) : (
                prestamos.map((prestamo) => (
                  <tr key={prestamo.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6">
                      {prestamo.socios ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                            <HandCoins size={20} weight="fill" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-slate-100">
                              {prestamo.socios.nombre} {prestamo.socios.apellido}
                            </span>
                            <span className="text-xs text-slate-500">Interno: {prestamo.socios.numero_interno}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Socio no encontrado</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Capital: Bs. {parseFloat(prestamo.monto).toLocaleString('es-BO')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {prestamo.cuotas} cuotas | {prestamo.interes}% interés
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                      Bs. {calcularTotalPagar(prestamo.monto, prestamo.interes).toLocaleString('es-BO', {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex flex-col">
                        <span>Inicio: {new Date(prestamo.fecha_inicio).toLocaleDateString('es-ES')}</span>
                        {prestamo.fecha_fin && <span>Fin: {new Date(prestamo.fecha_fin).toLocaleDateString('es-ES')}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        prestamo.estado === 'activo' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                        prestamo.estado === 'pagado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {prestamo.estado.toUpperCase()}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && <button onClick={() => handleOpenModal(prestamo)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><PencilSimple size={18} /></button>}
                          {canDelete && <button onClick={() => handleDelete(prestamo.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash size={18} /></button>}
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Préstamo" : "Nuevo Préstamo"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Socio Beneficiario</label>
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

              <div className="grid grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Monto (Capital Bs)</label>
                  <input type="number" step="0.01" min="0" required value={formData.monto} onChange={(e) => setFormData({...formData, monto: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Cantidad de Cuotas</label>
                  <input type="number" min="1" required value={formData.cuotas} onChange={(e) => setFormData({...formData, cuotas: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Interés (%)</label>
                  <input type="number" step="0.01" min="0" required value={formData.interes} onChange={(e) => setFormData({...formData, interes: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha Inicio</label>
                  <input type="date" required value={formData.fecha_inicio} onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha Fin Estimada</label>
                  <input type="date" value={formData.fecha_fin} onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
                  <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 appearance-none">
                    <option value="activo" className="dark:bg-slate-800">Activo</option>
                    <option value="pagado" className="dark:bg-slate-800">Pagado</option>
                    <option value="mora" className="dark:bg-slate-800">En Mora</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-8 flex justify-between items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total calculado (Capital + Interés):</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  Bs. {calcularTotalPagar(formData.monto, formData.interes).toLocaleString('es-BO', {minimumFractionDigits: 2})}
                </span>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                  Guardar Préstamo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
