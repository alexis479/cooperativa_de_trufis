"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // Si todo sale bien, redirigir al dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex justify-center items-center relative overflow-hidden font-sans">
      {/* Background Animations */}
      <div className="absolute w-full h-full -z-10 overflow-hidden">
        <div className="absolute w-[400px] h-[400px] bg-indigo-600 blur-[80px] rounded-full opacity-60 animate-float top-[-10%] left-[-10%]"></div>
        <div className="absolute w-[500px] h-[500px] bg-sky-500 blur-[80px] rounded-full opacity-60 animate-float bottom-[-20%] right-[-10%]" style={{ animationDelay: '-5s' }}></div>
      </div>

      <div className="w-full max-w-[420px] p-5 z-10 perspective-[1000px]">
        {/* Panel de Login (Glassmorphism) */}
        <div className="bg-slate-800/70 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-400 text-[15px]">Ingresa tus credenciales para acceder</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-5 text-sm animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-400 mb-2" htmlFor="loginEmail">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="loginEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className="w-full p-3.5 bg-slate-900/60 border border-white/10 rounded-xl text-slate-100 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all duration-300"
              />
            </div>
            
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-400 mb-2" htmlFor="loginPassword">
                Contraseña
              </label>
              <input
                type="password"
                id="loginPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full p-3.5 bg-slate-900/60 border border-white/10 rounded-xl text-slate-100 text-[15px] focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 transition-all duration-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full p-3.5 bg-blue-500 text-white rounded-xl text-[16px] font-semibold cursor-pointer transition-all duration-300 flex justify-center items-center shadow-[0_4px_14px_0_rgba(59,130,246,0.39)] hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-slate-400">
            <p>Sistema de Gestión Cooperativa Cumbre v2.0</p>
          </div>
        </div>
      </div>
    </main>
  );
}
