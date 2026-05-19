"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, Car } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

function VehiculosPageContent() {
  const [vehiculos, setVehiculos] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { permisos } = usePermissions();
  const canEdit = Object.keys(permisos).length === 0 || permisos["vehiculos"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["vehiculos"]?.eliminar === true;

  const [formData, setFormData] = useState({
    placa: "",
    modelo: "",
    color: "",
    socio_id: ""
  });

  const searchParams = useSearchParams();
  const searchVal = searchParams ? (searchParams.get("search") || "") : "";

  const filteredVehiculos = vehiculos.filter((vehiculo) => {
    const term = searchVal.toLowerCase();
    const socioName = vehiculo.socios ? `${vehiculo.socios.nombre} ${vehiculo.socios.apellido}` : '';
    const interno = vehiculo.socios?.numero_interno || '';
    return (
      vehiculo.placa?.toLowerCase().includes(term) ||
      vehiculo.modelo?.toLowerCase().includes(term) ||
      vehiculo.color?.toLowerCase().includes(term) ||
      socioName.toLowerCase().includes(term) ||
      interno.toString().toLowerCase().includes(term)
    );
  });

  useEffect(() => {
    fetchVehiculos();
    fetchSocios();
  }, []);

  const fetchVehiculos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*, socios(nombre, apellido, numero_interno)')
      .order('id', { ascending: false });
      
    if (!error && data) {
      setVehiculos(data);
    }
    setLoading(false);
  };

  const fetchSocios = async () => {
    const { data, error } = await supabase.from('socios').select('id, nombre, apellido, numero_interno').order('nombre');
    if (!error && data) {
      setSocios(data);
    }
  };

  const handleOpenModal = (vehiculo = null) => {
    if (vehiculo) {
      setEditingId(vehiculo.id);
      setFormData({
        placa: vehiculo.placa,
        modelo: vehiculo.modelo,
        color: vehiculo.color,
        socio_id: vehiculo.socio_id
      });
    } else {
      setEditingId(null);
      setFormData({ placa: "", modelo: "", color: "", socio_id: "" });
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
      alert("Debes seleccionar a qué socio pertenece este vehículo.");
      return;
    }

    if (editingId) {
      const { error } = await supabase.from('vehiculos').update(formData).eq('id', editingId);
      if (!error) {
        handleCloseModal();
        fetchVehiculos();
      } else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('vehiculos').insert([formData]);
      if (!error) {
        handleCloseModal();
        fetchVehiculos();
      } else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este vehículo?")) {
      const { error } = await supabase.from('vehiculos').delete().eq('id', id);
      if (!error) fetchVehiculos();
      else alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Gestión de Vehículos</h1>
          <p className="text-slate-500 text-sm mt-1">Administra la flota de trufis de la cooperativa</p>
        </div>
        {canEdit && <button onClick={() => handleOpenModal()} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:-translate-y-0.5"><Plus size={20} weight="bold" /><span>Nuevo Vehículo</span></button>}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Placa</th>
                <th className="p-4 uppercase tracking-wider text-xs">Modelo</th>
                <th className="p-4 uppercase tracking-wider text-xs">Color</th>
                <th className="p-4 uppercase tracking-wider text-xs">Socio Propietario (Nº Interno)</th>
                {(canEdit || canDelete) && <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando flota...
                  </td>
                </tr>
              ) : vehiculos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No hay vehículos registrados.
                  </td>
                </tr>
              ) : filteredVehiculos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No se encontraron vehículos con esa búsqueda.
                  </td>
                </tr>
              ) : (
                filteredVehiculos.map((vehiculo) => (
                  <tr key={vehiculo.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-500/10 text-purple-500 flex items-center justify-center">
                          <Car size={20} weight="fill" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          {vehiculo.placa}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 capitalize">{vehiculo.modelo}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 capitalize">
                      <div className="flex items-center gap-2">
                        {/* Pequeño círculo de color opcional */}
                        <span className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600" style={{ backgroundColor: vehiculo.color }}></span>
                        {vehiculo.color}
                      </div>
                    </td>
                    <td className="p-4">
                      {vehiculo.socios ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {vehiculo.socios.nombre} {vehiculo.socios.apellido}
                          </span>
                          <span className="text-xs text-slate-500">Interno: {vehiculo.socios.numero_interno}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Socio no encontrado</span>
                      )}
                    </td>
                    {(canEdit || canDelete) && (<td className="p-4 pr-6"><div className="flex items-center justify-end gap-2">{canEdit && <button onClick={() => handleOpenModal(vehiculo)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"><PencilSimple size={18} /></button>}{canDelete && <button onClick={() => handleDelete(vehiculo.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"><Trash size={18} /></button>}</div></td>)}
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
                {editingId ? "Editar Vehículo" : "Nuevo Vehículo"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Placa (Patente)</label>
                <input type="text" required value={formData.placa} onChange={(e) => setFormData({...formData, placa: e.target.value.toUpperCase()})} placeholder="Ej: 1234ABC" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500" />
              </div>
              
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Modelo</label>
                  <input type="text" required value={formData.modelo} onChange={(e) => setFormData({...formData, modelo: e.target.value})} placeholder="Ej: Toyota Noah" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Color</label>
                  <input type="text" required value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} placeholder="Ej: Blanco" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500" />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Socio Propietario</label>
                <select 
                  required 
                  value={formData.socio_id} 
                  onChange={(e) => setFormData({...formData, socio_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 appearance-none"
                >
                  <option value="" className="text-slate-500 dark:bg-slate-800">Seleccionar Socio...</option>
                  {socios.map(s => (
                    <option key={s.id} value={s.id} className="dark:bg-slate-800">{s.nombre} {s.apellido} (Nº {s.numero_interno})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end border-t border-slate-200 dark:border-slate-700 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-xl shadow-lg shadow-purple-500/20">
                  Guardar Vehículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VehiculosPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
      </div>
    }>
      <VehiculosPageContent />
    </Suspense>
  );
}
