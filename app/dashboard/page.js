"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
      } else {
        setUser(session.user);
      }
    };
    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-slate-900 text-white">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar Sesión
          </button>
        </header>

        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20">
              ✓
            </div>
            <div>
              <h2 className="text-2xl font-semibold">¡Autenticación Exitosa!</h2>
              <p className="text-slate-400">Has ingresado correctamente a la plataforma.</p>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 mt-6">
            <span className="block text-sm text-slate-400 mb-2">Usuario autenticado:</span>
            <code className="text-blue-400 text-sm break-all bg-black/30 px-3 py-2 rounded-lg block">
              {user.email}
            </code>
          </div>
        </div>
      </div>
    </main>
  );
}
