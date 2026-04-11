import React from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Droplet, Mail, Phone, MapPin, Menu, X } from "lucide-react";
import { Button } from "./ui/Button";
import { BrandLogo } from "./BrandLogo";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/#features", label: "Features" },
  { to: "/virtual-meter", label: "Virtual Meter", route: true },
  { to: "/#conservation", label: "Conservation" },
  { to: "/#plans", label: "Saving Plans" },
  { to: "/contact", label: "Contact Us", route: true },
];

export function Navbar() {
  const { token, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const baseNavClass = "rounded-full px-3 py-1.5 text-[15px] font-semibold transition";
  const activeNavClass = "bg-sky-100 text-sky-800 ring-1 ring-sky-200";
  const idleNavClass = "text-slate-600 hover:bg-slate-100 hover:text-slate-900";

  const isHashItemActive = (to) => {
    if (!to.startsWith("/#")) return false;
    const hash = to.slice(1);
    return location.pathname === "/" && location.hash === hash;
  };

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 sm:py-5">
            <Link to="/" className="flex items-center gap-2.5">
              <BrandLogo className="h-9 w-9" alt="" />
              <div className="leading-tight">
                <div className="text-[15px] font-extrabold tracking-tight text-slate-900">
                  SmartWater
                </div>
                <div className="text-[11px] text-slate-500">Track. Conserve. Save.</div>
              </div>
            </Link>

            <div className="hidden items-center gap-6 lg:flex">
              {navItems.map((item) => (
                item.route ? (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `${baseNavClass} ${isActive ? activeNavClass : idleNavClass}`}
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <a
                    key={item.to}
                    href={item.to}
                    className={`${baseNavClass} ${isHashItemActive(item.to) ? activeNavClass : idleNavClass}`}
                  >
                    {item.label}
                  </a>
                )
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {token ? (
                <>
                  <Button as={Link} to="/dashboard" variant="ghost" size="sm">
                    Dashboard
                  </Button>
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

            <button
              type="button"
              onClick={() => setIsOpen((open) => !open)}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-700 ring-1 ring-slate-200/90 transition hover:bg-slate-50 md:hidden"
              aria-expanded={isOpen}
              aria-label="Toggle navigation menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {isOpen ? (
            <div className="pb-4 md:hidden">
              <div className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
                {navItems.map((item) => (
                  item.route ? (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          isActive ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200" : "text-slate-700 hover:bg-slate-50"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ) : (
                    <a
                      key={item.to}
                      href={item.to}
                      className={`block rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        isHashItemActive(item.to) ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200" : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </a>
                  )
                ))}

                <div className="border-t border-slate-200/80 pt-3">
                  {token ? (
                    <div className="flex flex-col gap-2">
                      <Button as={Link} to="/dashboard" variant="ghost" size="sm" className="w-full">
                        Dashboard
                      </Button>
                      <Button onClick={logout} variant="dark" size="sm" className="w-full">
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Button as={NavLink} to="/login" variant="ghost" size="sm" className="w-full">
                        Login
                      </Button>
                      <Button as={NavLink} to="/register" size="sm" className="w-full">
                        Register
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          </div>
    </div>
  );
}

export function Footer() {
  const { token } = useAuth();

  return (
    <footer id="contact" className="relative mt-20 overflow-hidden border-t border-slate-200/80 bg-gradient-to-b from-white to-slate-50">
      <div className="pointer-events-none absolute left-0 top-0 h-60 w-60 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[108rem] px-4 py-14 sm:px-6 lg:px-10">
        {!token ? (
          <div className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
            <div>
              <div className="text-lg font-black tracking-tight text-slate-900">Start reducing your water bill today</div>
              <div className="mt-1 text-sm text-slate-600">Create a free account and get your first usage insights in minutes.</div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button as={Link} to="/register" size="sm">Get Started</Button>
              <Button as={Link} to="/virtual-meter" variant="ghost" size="sm">Open Virtual Meter</Button>
            </div>
          </div>
        ) : null}

        <div className="mt-12 grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-11 w-11" alt="" />
              <div>
                <div className="text-base font-extrabold tracking-tight text-slate-900">SmartWater</div>
                <div className="text-xs text-slate-500">Track. Conserve. Save.</div>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              Helping households monitor and reduce their water consumption through smart tracking
              and personalized conservation tips.
            </p>

            <div className="mt-6 space-y-2 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-slate-400" /> hello@smartwater.io</div>
              <div className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> (+94)76 815 00 79</div>
              <div className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> Colombo, Sri Lanka</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold tracking-[0.16em] text-slate-900">PRODUCT</div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <Link className="block hover:text-slate-900" to="/virtual-meter">Virtual Meter</Link>
              <a className="block hover:text-slate-900" href="/#conservation">Conservation Tips</a>
              <a className="block hover:text-slate-900" href="/#plans">Saving Plans</a>
              <a className="block hover:text-slate-900" href="/#features">Analytics</a>
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold tracking-[0.16em] text-slate-900">SUPPORT</div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <Link className="block hover:text-slate-900" to="/contact">Contact Us</Link>
              <a className="block hover:text-slate-900" href="/#features">Help Center</a>
              <a className="block hover:text-slate-900" href="/#conservation">Water Facts</a>
              <a className="block hover:text-slate-900" href="/#contact">Community</a>
            </div>
          </div>

          <div>
            <div className="text-xs font-extrabold tracking-[0.16em] text-slate-900">COMPANY</div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <a className="block hover:text-slate-900" href="/#features">About Us</a>
              <a className="block hover:text-slate-900" href="/#plans">Plans</a>
              <a className="block hover:text-slate-900" href="/#contact">Partners</a>
              <a className="block hover:text-slate-900" href="/#contact">Privacy</a>
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

