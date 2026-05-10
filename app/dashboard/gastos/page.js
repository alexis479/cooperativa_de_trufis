"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, Receipt } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

export default function GastosPage() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [userId, setUserId] = useState(null);

  const { permisos } = usePermissions();
  const canEdit = Object.keys(permisos).length === 0 || permisos["gastos"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["gastos"]?.eliminar === true;
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    concepto: "",
    pago_a: "",
    categoria: "Mantenimiento",
    monto: ""
  });

  const categorias = ["Sueldo", "Mantenimiento", "Servicios", "Otros"];

  useEffect(() => {
    fetchSessionAndGastos();
  }, []);

  const fetchSessionAndGastos = async () => {
    setLoading(true);
    // Obtener usuario actual
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // Necesitamos el ID numérico de la tabla usuarios pública, o usar el ID del auth si estuviera vinculado.
      // Por simplicidad en este momento, usaremos el ID 1 (Administrador) o buscaremos su email
      const { data: userData } = await supabase.from('usuarios').select('id').eq('correo', session.user.email).single();
      if (userData) {
        setUserId(userData.id);
      } else {
        setUserId(null); // No usar fallback porque la tabla está vacía y da error de llave foránea
      }
    }

    const { data, error } = await supabase
      .from('gastos')
      .select('*, usuarios(nombre)')
      .order('fecha', { ascending: false });
      
    if (!error && data) {
      setGastos(data);
    }
    setLoading(false);
  };

  const handleOpenModal = (gasto = null) => {
    if (gasto) {
      setEditingId(gasto.id);
      
      let conceptoLimpio = gasto.concepto || "";
      let pagoA = "";
      
      if (conceptoLimpio.includes("[Pago a: ")) {
        const parts = conceptoLimpio.split(" [Pago a: ");
        conceptoLimpio = parts[0];
        pagoA = parts[1].replace("]", "");
      }

      setFormData({
        fecha: gasto.fecha || new Date().toISOString().split('T')[0],
        concepto: conceptoLimpio,
        pago_a: pagoA,
        categoria: gasto.categoria || "Otros",
        monto: gasto.monto || ""
      });
    } else {
      setEditingId(null);
      setFormData({ 
        fecha: new Date().toISOString().split('T')[0], 
        concepto: "", 
        pago_a: "",
        categoria: "Mantenimiento", 
        monto: "" 
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
    
    try {
      const montoNum = parseFloat(formData.monto);
      if (isNaN(montoNum)) {
        alert("Por favor, ingresa un monto válido.");
        return;
      }

      const conceptoFinal = formData.pago_a 
        ? `${formData.concepto} [Pago a: ${formData.pago_a}]` 
        : formData.concepto;

      const payload = {
        fecha: formData.fecha,
        concepto: conceptoFinal,
        categoria: formData.categoria,
        monto: montoNum
      };

      if (userId) {
        payload.usuario_id = userId;
      }

      let res;
      if (editingId) {
        res = await supabase.from('gastos').update(payload).eq('id', editingId);
      } else {
        res = await supabase.from('gastos').insert([payload]);
      }
      
      if (res.error) {
        alert("Error de base de datos: " + res.error.message);
      } else {
        handleCloseModal();
        await fetchSessionAndGastos();
      }
    } catch (err) {
      alert("Error inesperado: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este gasto?")) {
      try {
        const { error } = await supabase.from('gastos').delete().eq('id', id);
        if (error) {
          console.error("Error al eliminar:", error);
          alert("Error de base de datos al eliminar: " + error.message);
        } else {
          await fetchSessionAndGastos();
        }
      } catch (err) {
        console.error("Error inesperado al eliminar:", err);
        alert("Error crítico al intentar eliminar: " + err.message);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestión de Gastos</h1>
          <p className="text-slate-500 text-sm mt-1">Control de egresos y compras de la cooperativa</p>
        </div>
        {canEdit && (
          <button onClick={() => handleOpenModal()} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:-translate-y-0.5">
            <Plus size={20} weight="bold" /><span>Nuevo Gasto</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Fecha</th>
                <th className="p-4 uppercase tracking-wider text-xs">Concepto / Detalle</th>
                <th className="p-4 uppercase tracking-wider text-xs">Pago a</th>
                <th className="p-4 uppercase tracking-wider text-xs">Categoría</th>
                <th className="p-4 uppercase tracking-wider text-xs">Monto (Bs)</th>
                <th className="p-4 uppercase tracking-wider text-xs">Registrado por</th>
                {(canEdit || canDelete) && <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando gastos...
                  </td>
                </tr>
              ) : gastos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">
                    No hay gastos registrados.
                  </td>
                </tr>
              ) : (
                gastos.map((gasto) => (
                  <tr key={gasto.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6 text-slate-600 dark:text-slate-400">
                      {new Date(gasto.fecha).toLocaleDateString('es-ES')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                          <Receipt size={20} weight="fill" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {gasto.concepto?.includes("[Pago a: ") ? gasto.concepto.split(" [Pago a: ")[0] : gasto.concepto}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">
                        {gasto.concepto?.includes("[Pago a: ") 
                          ? gasto.concepto.split(" [Pago a: ")[1].replace("]", "") 
                          : (gasto.pago_a || '-')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm">
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-red-600 dark:text-red-400">
                      Bs. {parseFloat(gasto.monto).toLocaleString('es-BO', {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {gasto.usuarios ? gasto.usuarios.nombre : 'Sistema'}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && <button onClick={() => handleOpenModal(gasto)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"><PencilSimple size={18} /></button>}
                          {canDelete && <button onClick={() => handleDelete(gasto.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash size={18} /></button>}
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
                {editingId ? "Editar Gasto" : "Registrar Gasto"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Concepto del Gasto</label>
                <input 
                  type="text" 
                  required 
                  value={formData.concepto} 
                  onChange={(e) => setFormData({...formData, concepto: e.target.value})} 
                  placeholder="Ej: Compra de material de escritorio..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500" 
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Pago a (Entidad/Persona)</label>
                <input 
                  type="text" 
                  value={formData.pago_a} 
                  onChange={(e) => setFormData({...formData, pago_a: e.target.value})} 
                  placeholder="Ej: Saguapac, CRE, Tienda..." 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500" 
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Categoría</label>
                <select 
                  required 
                  value={formData.categoria} 
                  onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 appearance-none"
                >
                  {categorias.map(cat => (
                    <option key={cat} value={cat} className="dark:bg-slate-800">{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-8">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.fecha} 
                    onChange={(e) => setFormData({...formData, fecha: e.target.value})} 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500" 
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500" 
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/20">
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
