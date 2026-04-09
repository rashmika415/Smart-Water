import React from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../ui/Button";
import { LogOut } from "lucide-react";
import { AdminSidebar, AdminMobileNav } from "../Sidebar";

export function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="min-w-0 lg:hidden">
                <div className="text-sm font-extrabold text-slate-900">Admin</div>
                <div className="truncate text-xs text-slate-500">{user?.email}</div>
              </div>
              <div className="hidden min-w-0 lg:block">
                <div className="text-sm font-extrabold text-slate-900">
                  Welcome, {user?.name || "Admin"}
                </div>
                <div className="truncate text-xs text-slate-500">{user?.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={logout} variant="dark" size="sm" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>

            <AdminMobileNav />
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
