import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../ui/Button";
import { BrandLogo } from "../BrandLogo";

import { Home, LayoutDashboard, User, Building2, Receipt, CloudSun, LogOut, Activity, Leaf, Waves, ClipboardList, Sparkles, ChevronsLeft, ChevronsRight } from "lucide-react";

import clsx from "clsx";

const navSections = [
  {
    title: "Overview",
    items: [
      { to: "/user", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/user/profile", label: "My Profile", icon: User },
    ],
  },
  {
    title: "Usage",
    items: [
      { to: "/user/water-activities", label: "Water Activities", icon: Waves },
      { to: "/user/usage", label: "Usage History", icon: Activity },
      { to: "/user/carbon-analytics", label: "Carbon Analytics", icon: Leaf },
      { to: "/user/households", label: "My Households", icon: Building2 },
    ],
  },
  {
    title: "Planning",
    items: [
      { to: "/user/estimated-bill", label: "Estimated Bill", icon: Receipt },
      { to: "/user/saving-plane", label: "Saving Plane", icon: Sparkles },
      { to: "/user/weather-insights", label: "Weather Insights", icon: CloudSun },
      { to: "/user/activities", label: "Maintenance Updates", icon: ClipboardList },
    ],
  },
];

const nav = navSections.flatMap((section) => section.items);

const USER_SIDEBAR_KEY = "smartwater.userSidebarCollapsed";


export function UserLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = React.useState(() => {
    try {
      return localStorage.getItem(USER_SIDEBAR_KEY) === "1";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(USER_SIDEBAR_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore storage errors
    }
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex min-h-screen">
        <aside
          className={clsx(
            "hidden shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur transition-all duration-300 lg:block",
            collapsed ? "w-20" : "w-64"
          )}
        >
          <div className="flex h-full flex-col px-4 py-6">
            <div className={clsx("flex items-center", collapsed ? "justify-center" : "justify-between px-2") }>
              <Link to="/user" className={clsx("flex items-center", collapsed ? "justify-center" : "gap-2") }>
                <BrandLogo className="h-10 w-10 shrink-0" alt="" />
                {!collapsed ? (
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">SmartWater</div>
                    <div className="text-[11px] font-semibold text-brand-700">User Panel</div>
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

            <nav className={clsx("mt-8", collapsed ? "space-y-4" : "space-y-5") }>
              {navSections.map((section) => (
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
                        end={Boolean(item.end)}
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
                  "flex items-center rounded-xl py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  collapsed ? "justify-center px-2" : "gap-2 px-3"
                )}
              >
                <Home className="h-4 w-4" />
                {!collapsed ? "Public site" : null}
              </Link>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <BrandLogo className="h-9 w-9 shrink-0 lg:hidden" alt="" />
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900">Welcome, {user?.name || "User"}</div>
                  <div className="truncate text-xs text-slate-500">{user?.email}</div>
                </div>
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
