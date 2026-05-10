import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { PermissionsProvider } from "@/context/PermissionsContext";
import { MobileMenuProvider } from "@/context/MobileMenuContext";

export default function DashboardLayout({ children }) {
  return (
    <PermissionsProvider>
      <MobileMenuProvider>
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
          <Sidebar />
          <div className="flex flex-col flex-1 h-full w-full overflow-hidden">
            <Header />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
              {children}
            </main>
          </div>
        </div>
      </MobileMenuProvider>
    </PermissionsProvider>
  );
}
