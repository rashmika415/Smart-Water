import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../ui/Button";
import { Droplet, Home, LayoutDashboard, User, Building2, Receipt, CloudSun, LogOut, Activity, Leaf, Waves } from "lucide-react";
import clsx from "clsx";

const nav = [
  { to: "/user", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/user/profile", label: "My Profile", icon: User },
  { to: "/user/water-activities", label: "Water Activities", icon: Waves },
  { to: "/user/usage", label: "Usage History", icon: Activity },
  { to: "/user/carbon-analytics", label: "Carbon Analytics", icon: Leaf },
  { to: "/user/households", label: "My Households", icon: Building2 },
  { to: "/user/estimated-bill", label: "Estimated Bill", icon: Receipt },
  { to: "/user/weather-insights", label: "Weather Insights", icon: CloudSun },
];

export function UserLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur lg:block">
          <div className="flex h-full flex-col px-4 py-6">
            <Link to="/user" className="flex items-center gap-2 px-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-sky-500 text-white shadow-sm">
                <Droplet className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-extrabold text-slate-900">SmartWater</div>
                <div className="text-[11px] font-semibold text-brand-700">User Panel</div>
              </div>
            </Link>

            <nav className="mt-8 space-y-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={Boolean(item.end)}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                      isActive
                        ? "bg-brand-50 text-brand-900 ring-1 ring-brand-100"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-auto border-t border-slate-100 pt-4">
              <Link
                to="/"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                <Home className="h-4 w-4" />
                Public site
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Welcome, {user?.name || "User"}</div>
                <div className="truncate text-xs text-slate-500">{user?.email}</div>
              </div>
              <Button onClick={logout} variant="dark" size="sm" className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={Boolean(item.end)}
                  className={({ isActive }) =>
                    clsx(
                      "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold",
                      isActive ? "bg-brand-100 text-brand-900" : "bg-slate-100 text-slate-600"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
