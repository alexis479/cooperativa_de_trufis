"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, Moon, Sun, Bell, List } from "@phosphor-icons/react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";

export default function Header() {
  const [theme, setTheme] = useState("dark");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserEmail(session.user.email);
      }
    };
    getUser();
  }, []);

  const toggleTheme = () => {
    if (theme === "dark") {
      document.documentElement.classList.remove("dark");
      setTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      setTheme("dark");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-slate-600 dark:text-slate-300">
          <List size={24} />
        </button>
        <div className="hidden lg:flex items-center bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 w-72 transition-colors duration-300">
          <MagnifyingGlass size={20} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar..."
            className="bg-transparent border-none outline-none w-full text-sm text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <button onClick={toggleTheme} className="text-slate-500 hover:text-emerald-500 transition-colors">
          {theme === "dark" ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        
        <button className="text-slate-500 hover:text-emerald-500 transition-colors">
          <Bell size={22} />
        </button>
        
        <div 
          onClick={handleLogout}
          className="flex items-center gap-3 pl-5 border-l border-slate-200 dark:border-slate-700 cursor-pointer group"
          title="Cerrar Sesión"
        >
          <div className="flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
              {userEmail ? userEmail.split('@')[0] : 'Usuario'}
            </span>
            <span className="text-xs text-slate-500">Cerrar Sesión</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
