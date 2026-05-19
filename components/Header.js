"use client";

import { useEffect, useState } from "react";
import { MagnifyingGlass, Moon, Sun, Bell, List } from "@phosphor-icons/react";
import { supabase } from "@/utils/supabase";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useMobileMenu } from "@/context/MobileMenuContext";
import { Suspense } from "react";

export default function Header() {
  const [theme, setTheme] = useState("dark");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const { toggleMobileMenu } = useMobileMenu();

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
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-8 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleMobileMenu}
          className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <List size={24} />
        </button>
        <Suspense fallback={
          <div className="hidden lg:flex items-center bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 w-72">
            <MagnifyingGlass size={20} className="text-slate-400 mr-2" />
            <div className="text-slate-400 text-xs">Cargando buscador...</div>
          </div>
        }>
          <SearchInput />
        </Suspense>
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
          className="flex items-center gap-3 pl-3 md:pl-5 border-l border-slate-200 dark:border-slate-700 cursor-pointer group"
          title="Cerrar Sesión"
        >
          <div className="hidden md:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-500 transition-colors">
              {userEmail ? userEmail.split('@')[0] : 'Usuario'}
            </span>
            <span className="text-xs text-slate-500">Cerrar Sesión</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold shrink-0">
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSearchQuery(searchParams?.get("search") || "");
  }, [searchParams]);

  const handleSearchChange = (term) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`);

    // Despachar evento instantáneo para notificar a los componentes de la página
    const event = new CustomEvent("globalSearch", { detail: term });
    window.dispatchEvent(event);
  };

  return (
    <div className="hidden lg:flex items-center bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 w-72 transition-colors duration-300">
      <MagnifyingGlass size={20} className="text-slate-400 mr-2" />
      <input
        type="text"
        placeholder="Buscar..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          handleSearchChange(e.target.value);
        }}
        className="bg-transparent border-none outline-none w-full text-sm text-slate-800 dark:text-slate-200"
      />
    </div>
  );
}
