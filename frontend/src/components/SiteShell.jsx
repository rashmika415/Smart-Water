import React from "react";
import { Link, NavLink } from "react-router-dom";
import { Droplet } from "lucide-react";
import { Button } from "./ui/Button";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/#features", label: "Features" },
  { to: "/#virtual-meter", label: "Virtual Meter" },
  { to: "/#conservation", label: "Conservation" },
  { to: "/#plans", label: "Saving Plans" },
  { to: "/#contact", label: "Contact" },
];

export function Navbar() {
  const { token, logout, user } = useAuth();

  return (
    <div className="sticky top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6 sm:py-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-sky-500 text-white shadow-sm">
                <Droplet className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <div className="text-sm font-extrabold tracking-tight text-slate-900">
                  SmartWater
                </div>
                <div className="text-[11px] text-slate-500">Track. Conserve. Save.</div>
              </div>
            </Link>

            <div className="hidden items-center gap-6 lg:flex">
              {navItems.map((item) => (
                <a
                  key={item.to}
                  href={item.to}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {token ? (
                <>
                  <Button as={Link} to="/dashboard" variant="ghost" size="sm">
                    Dashboard
                  </Button>
                  {user?.role === 'admin' && (
                    <Button as={Link} to="/admin" variant="ghost" size="sm">
                      Admin
                    </Button>
                  )}
                  <Button onClick={logout} variant="dark" size="sm">
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Button as={NavLink} to="/login" variant="ghost" size="sm">
                    Login
                  </Button>
                  <Button as={NavLink} to="/register" size="sm">
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

export function Footer() {
  return (
    <footer id="contact" className="mt-24 border-t border-slate-200/70 bg-white/60">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-sky-500 text-white shadow-sm">
                <Droplet className="h-5 w-5" />
              </span>
              <div>
                <div className="text-base font-extrabold tracking-tight text-slate-900">
                  SmartWater
                </div>
                <div className="text-xs text-slate-500">Track. Conserve. Save.</div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              Helping households monitor and reduce their water consumption through smart tracking
              and personalized conservation tips.
            </p>
            <div className="mt-6 space-y-2 text-sm text-slate-600">
              <div>hello@smartwater.io</div>
              <div>(+94)76 815 00 79</div>
              <div>Colombo,Sri Lanka</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-extrabold text-slate-900">PRODUCT</div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <a className="block hover:text-slate-900" href="/#virtual-meter">Virtual Meter</a>
              <a className="block hover:text-slate-900" href="/#conservation">Conservation Tips</a>
              <a className="block hover:text-slate-900" href="/#plans">Saving Plans</a>
              <a className="block hover:text-slate-900" href="/#features">Analytics</a>
            </div>
          </div>

          <div>
            <div className="text-sm font-extrabold text-slate-900">RESOURCES</div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <span className="block">Help Center</span>
              <span className="block">Blog</span>
              <span className="block">Water Facts</span>
              <span className="block">Community</span>
            </div>
          </div>

          <div>
            <div className="text-sm font-extrabold text-slate-900">COMPANY</div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <span className="block">About Us</span>
              <span className="block">Careers</span>
              <span className="block">Press</span>
              <span className="block">Partners</span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-slate-200/70 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center">
          <div>© 2026 SmartWater. All rights reserved.</div>
          <div className="flex items-center gap-2">
            <Droplet className="h-4 w-4 text-brand-600" />
            <span>Made with care for our planet</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

