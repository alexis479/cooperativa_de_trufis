"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";

const PermissionsContext = createContext();

export function PermissionsProvider({ children }) {
  const [permisos, setPermisos] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      // 1. Obtener sesión actual
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      // 2. Buscar al usuario en la tabla pública por correo para obtener su rol_id
      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol_id')
        .eq('correo', session.user.email)
        .single();

      if (userData && userData.rol_id) {
        // 3. Buscar el rol y sus permisos
        const { data: roleData } = await supabase
          .from('roles')
          .select('permisos_json')
          .eq('id', userData.rol_id)
          .single();

        if (roleData && roleData.permisos_json) {
          setPermisos(JSON.parse(roleData.permisos_json));
        }
      }
    } catch (e) {
      console.error("Error fetching permissions:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionsContext.Provider value={{ permisos, loading }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
