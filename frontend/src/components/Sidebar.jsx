import React from "react";
import { NavLink, Link } from "react-router-dom";
import clsx from "clsx";
import { Droplet, LayoutDashboard, Home, Users, Building2, Layers3 } from "lucide-react";

export const ADMIN_NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Manage Users", icon: Users, end: false },
  { to: "/admin/households", label: "Manage Households", icon: Building2, end: false },
  { to: "/admin/households-zones", label: "Households & Zones", icon: Layers3, end: false },
];

export function AdminSidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur lg:block">
      <div className="flex h-full flex-col px-4 py-6">
        <Link to="/admin" className="flex items-center gap-2 px-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-sky-500 text-white shadow-sm">
            <Droplet className="h-5 w-5" />
          </span>
          <div>
            <div className="text-sm font-extrabold text-slate-900">SmartWater</div>
            <div className="text-[11px] font-semibold text-brand-700">Admin</div>
          </div>
        </Link>

        <nav className="mt-8 space-y-1">
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
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
  );
}

export function AdminMobileNav() {
  return (
    <div className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
      {ADMIN_NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
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
  );
}
