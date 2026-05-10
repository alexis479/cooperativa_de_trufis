"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Plus, PencilSimple, Trash, X, SteeringWheel, CalendarBlank } from "@phosphor-icons/react";
import { usePermissions } from "@/context/PermissionsContext";

export default function AlquileresPage() {
  const [alquileres, setAlquileres] = useState([]);
  const [socios, setSocios] = useState([]);
  const [choferes, setChoferes] = useState([]);
  const [lineas, setLineas] = useState([]);
  const [tiposLinea, setTiposLinea] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const { permisos } = usePermissions();
  const canEdit = Object.keys(permisos).length === 0 || permisos["alquileres"]?.editar === true;
  const canDelete = Object.keys(permisos).length === 0 || permisos["alquileres"]?.eliminar === true;

  const [formData, setFormData] = useState({
    socio_id: "",
    chofer_id: "",
    nombre_socio: "",
    nombre_chofer: "",
    numero_interno: "",
    monto: "",
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: "",
    estado: "activo",
    observacion: "",
    linea_id: "",
    tipo_linea_id: ""
  });

  useEffect(() => {
    fetchAlquileres();
    fetchRelaciones();
  }, []);

  const fetchAlquileres = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('alquiler_de_lineas')
      .select('*, lineas(nombre), tipo_de_linea(nombre_ruta)')
      .order('fecha_inicio', { ascending: false });

    if (!error && data) setAlquileres(data);
    setLoading(false);
  };

  const fetchRelaciones = async () => {
    const [
      { data: sociosData },
      { data: choferesData },
      { data: lineasData },
      { data: tiposData }
    ] = await Promise.all([
      supabase.from('socios').select('id, nombre, apellido, numero_interno').order('numero_interno'),
      supabase.from('choferes').select('id, nombre, apellido').order('nombre'),
      supabase.from('lineas').select('*'),
      supabase.from('tipo_de_linea').select('*'),
    ]);

    if (sociosData) setSocios(sociosData);
    if (choferesData) setChoferes(choferesData);
    if (lineasData) setLineas(lineasData);
    if (tiposData) setTiposLinea(tiposData);
  };

  // Cuando se selecciona un socio, auto-rellenar nombre_socio y numero_interno
  const handleSocioChange = (socioId) => {
    const socio = socios.find(s => s.id.toString() === socioId);
    setFormData({
      ...formData,
      socio_id: socioId,
      nombre_socio: socio ? `${socio.nombre} ${socio.apellido}` : "",
      numero_interno: socio?.numero_interno || ""
    });
  };

  // Cuando se selecciona un chofer, auto-rellenar nombre_chofer
  const handleChoferChange = (choferId) => {
    const chofer = choferes.find(c => c.id.toString() === choferId);
    setFormData({
      ...formData,
      chofer_id: choferId,
      nombre_chofer: chofer ? `${chofer.nombre} ${chofer.apellido}` : ""
    });
  };

  const handleOpenModal = (alquiler = null) => {
    if (alquiler) {
      setEditingId(alquiler.id);
      // Buscar el socio y chofer que coincidan con los nombres guardados
      const socioMatch = socios.find(s => `${s.nombre} ${s.apellido}` === alquiler.nombre_socio);
      const choferMatch = choferes.find(c => `${c.nombre} ${c.apellido}` === alquiler.nombre_chofer);
      setFormData({
        socio_id: socioMatch?.id?.toString() || "",
        chofer_id: choferMatch?.id?.toString() || "",
        nombre_socio: alquiler.nombre_socio,
        nombre_chofer: alquiler.nombre_chofer,
        numero_interno: alquiler.numero_interno || "",
        monto: alquiler.monto,
        fecha_inicio: alquiler.fecha_inicio,
        fecha_fin: alquiler.fecha_fin || "",
        estado: alquiler.estado,
        observacion: alquiler.observacion || "",
        linea_id: alquiler.linea_id || "",
        tipo_linea_id: alquiler.tipo_linea_id || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        socio_id: "", chofer_id: "", nombre_socio: "", nombre_chofer: "",
        numero_interno: "", monto: "",
        fecha_inicio: new Date().toISOString().split('T')[0], fecha_fin: "",
        estado: "activo", observacion: "", linea_id: "", tipo_linea_id: ""
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

    const payload = {
      nombre_socio: formData.nombre_socio,
      nombre_chofer: formData.nombre_chofer,
      numero_interno: formData.numero_interno,
      monto: parseFloat(formData.monto),
      fecha_inicio: formData.fecha_inicio,
      fecha_fin: formData.fecha_fin || null,
      estado: formData.estado,
      observacion: formData.observacion,
      linea_id: formData.linea_id || null,
      tipo_linea_id: formData.tipo_linea_id || null,
    };

    if (editingId) {
      const { error } = await supabase.from('alquiler_de_lineas').update(payload).eq('id', editingId);
      if (!error) { handleCloseModal(); fetchAlquileres(); }
      else alert("Error: " + error.message);
    } else {
      const { error } = await supabase.from('alquiler_de_lineas').insert([payload]);
      if (!error) { handleCloseModal(); fetchAlquileres(); }
      else alert("Error: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar este registro de alquiler?")) {
      const { error } = await supabase.from('alquiler_de_lineas').delete().eq('id', id);
      if (!error) fetchAlquileres();
      else alert("Error: " + error.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Alquiler de Líneas</h1>
          <p className="text-slate-500 text-sm mt-1">Control de alquileres de líneas a choferes</p>
        </div>
        {canEdit && (
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            <Plus size={20} weight="bold" />
            <span>Nuevo Alquiler</span>
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <th className="p-4 pl-6 uppercase tracking-wider text-xs">Interno / Socio</th>
                <th className="p-4 uppercase tracking-wider text-xs">Chofer</th>
                <th className="p-4 uppercase tracking-wider text-xs">Línea / Ruta</th>
                <th className="p-4 uppercase tracking-wider text-xs">Monto</th>
                <th className="p-4 uppercase tracking-wider text-xs">Vigencia</th>
                <th className="p-4 uppercase tracking-wider text-xs">Estado</th>
                {(canEdit || canDelete) && <th className="p-4 pr-6 uppercase tracking-wider text-xs text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">
                    <div className="flex justify-center mb-2">
                      <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                    Cargando alquileres...
                  </td>
                </tr>
              ) : alquileres.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No hay alquileres registrados.</td>
                </tr>
              ) : (
                alquileres.map((alquiler) => (
                  <tr key={alquiler.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {alquiler.numero_interno ? `Interno #${alquiler.numero_interno}` : 'Sin interno'}
                        </span>
                        <span className="text-sm text-slate-500">{alquiler.nombre_socio}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">{alquiler.nombre_chofer}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <SteeringWheel size={18} className="text-indigo-500" />
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {alquiler.tipo_de_linea?.nombre_ruta || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                      Bs. {parseFloat(alquiler.monto).toLocaleString('es-BO')}
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <CalendarBlank size={14} />
                        <span>{new Date(alquiler.fecha_inicio).toLocaleDateString('es-ES')}</span>
                        {alquiler.fecha_fin && <span> – {new Date(alquiler.fecha_fin).toLocaleDateString('es-ES')}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        alquiler.estado === 'activo'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                      }`}>
                        {alquiler.estado?.toUpperCase()}
                      </span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button onClick={() => handleOpenModal(alquiler)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                              <PencilSimple size={18} />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(alquiler.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
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

      {/* Modal CRUD */}
      {isModalOpen && canEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {editingId ? "Editar Alquiler" : "Nuevo Alquiler de Línea"}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">

              {/* Socio y Número de Interno (auto-completado) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Socio / Dueño <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.socio_id}
                    onChange={(e) => handleSocioChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="" disabled className="dark:bg-slate-800">-- Selecciona un socio --</option>
                    {socios.map(s => (
                      <option key={s.id} value={s.id} className="dark:bg-slate-800">
                        {s.nombre} {s.apellido} {s.numero_interno ? `(Int. #${s.numero_interno})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Número de Interno</label>
                  <input
                    type="text"
                    readOnly
                    value={formData.numero_interno}
                    placeholder="Auto-completado"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Chofer */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Chofer <span className="text-red-400">*</span>
                </label>
                <select
                  required
                  value={formData.chofer_id}
                  onChange={(e) => handleChoferChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="" disabled className="dark:bg-slate-800">-- Selecciona un chofer --</option>
                  {choferes.map(c => (
                    <option key={c.id} value={c.id} className="dark:bg-slate-800">
                      {c.nombre} {c.apellido}
                    </option>
                  ))}
                </select>
              </div>

              {/* Línea / Ruta */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Línea / Ruta</label>
                <select
                  value={formData.tipo_linea_id}
                  onChange={(e) => setFormData({...formData, tipo_linea_id: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="" className="dark:bg-slate-800">-- Selecciona --</option>
                  {tiposLinea.map(t => (
                    <option key={t.id} value={t.id} className="dark:bg-slate-800">{t.nombre_ruta}</option>
                  ))}
                </select>
              </div>

              {/* Monto y Fecha inicio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Monto (Bs.) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.monto}
                    onChange={(e) => setFormData({...formData, monto: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Fecha fin y Estado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fecha Fin (Opcional)</label>
                  <input
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Estado</label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({...formData, estado: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="activo" className="dark:bg-slate-800">Activo</option>
                    <option value="inactivo" className="dark:bg-slate-800">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Observación */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Observación</label>
                <textarea
                  rows="2"
                  value={formData.observacion}
                  onChange={(e) => setFormData({...formData, observacion: e.target.value})}
                  placeholder="Notas adicionales..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20 transition-all">
                  Guardar Alquiler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
