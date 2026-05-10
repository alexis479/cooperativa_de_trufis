import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { PermissionsProvider } from "@/context/PermissionsContext";

export default function DashboardLayout({ children }) {
  return (
    <PermissionsProvider>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
        <Sidebar />
        <div className="flex flex-col flex-1 h-full w-full">
          <Header />
          <main className="flex-1 p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </PermissionsProvider>
  );
}
