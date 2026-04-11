import React from "react";
import { NavLink, Link } from "react-router-dom";
import clsx from "clsx";

import {
  LayoutDashboard,
  Home,
  Users,
  Building2,
  Layers3,
  ClipboardList,
  Droplets,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";

export const ADMIN_SECTIONS = [
  {
    title: "Overview",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    title: "Management",
    items: [
      { to: "/admin/users", label: "Manage Users", icon: Users, end: false },
      { to: "/admin/households", label: "Manage Households", icon: Building2, end: false },
      { to: "/admin/households-zones", label: "Households & Zones", icon: Layers3, end: false },
    ],
  },
  {
    title: "Operations",
    items: [
      { to: "/admin/activities", label: "Manage Activities", icon: ClipboardList, end: false },
      { to: "/admin/usage", label: "Manage Usage", icon: Droplets, end: false },
        { to: "/admin/saving-plans", label: "Water Saving Plan", icon: Sparkles, end: false },

    ],
  },
];

export const ADMIN_NAV = ADMIN_SECTIONS.flatMap((section) => section.items);

const ADMIN_SIDEBAR_KEY = "smartwater.adminSidebarCollapsed";

export function AdminSidebar() {
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem(ADMIN_SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(ADMIN_SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  return (
    <aside
      className={clsx(
        "hidden shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur transition-all duration-300 lg:block",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col px-4 py-6">
        <div className={clsx("flex items-center", collapsed ? "justify-center" : "justify-between px-2")}>
          <Link to="/admin" className={clsx("flex items-center", collapsed ? "justify-center" : "gap-2")}>
            <BrandLogo className="h-10 w-10 shrink-0" alt="" />
            {!collapsed ? (
              <div>
                <div className="text-sm font-extrabold text-slate-900">SmartWater</div>
                <div className="text-[11px] font-semibold text-brand-700">Admin</div>
              </div>
            ) : null}
          </Link>

          {!collapsed ? (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-3 grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Expand sidebar"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        ) : null}

        <nav className={clsx("mt-8", collapsed ? "space-y-4" : "space-y-5")}>
          {ADMIN_SECTIONS.map((section) => (
            <div key={section.title}>
              {!collapsed ? (
                <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {section.title}
                </div>
              ) : null}

              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      clsx(
                        "group flex items-center rounded-xl py-2.5 text-sm font-semibold transition",
                        collapsed ? "justify-center px-2" : "gap-3 px-3",
                        isActive
                          ? "bg-brand-50 text-brand-900 ring-1 ring-brand-100"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {!collapsed ? (
                          <span
                            className={clsx(
                              "h-5 w-1 shrink-0 rounded-full transition",
                              isActive ? "bg-brand-500" : "bg-transparent group-hover:bg-slate-200"
                            )}
                          />
                        ) : null}
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed ? item.label : null}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-4">
          <Link
            to="/"
            title={collapsed ? "Public site" : undefined}
            aria-label={collapsed ? "Public site" : undefined}
            className={clsx(
              "flex items-center rounded-xl py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900",
              collapsed ? "justify-center px-2" : "gap-2 px-3"
            )}
          >
            <Home className="h-4 w-4" />
            {!collapsed ? "Public site" : null}
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
