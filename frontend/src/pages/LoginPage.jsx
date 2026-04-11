import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Clock3, Eye, EyeOff, Leaf, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandLogo } from "../components/BrandLogo";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(() => location.state?.from || "/dashboard", [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_54%,#f3fbf6_100%)] px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_16%,rgba(14,165,233,0.17),transparent_36%),radial-gradient(circle_at_86%_12%,rgba(16,185,129,0.14),transparent_34%)]"
      />
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <BrandLogo className="h-10 w-10" alt="" />
            <div className="text-sm font-extrabold text-slate-900">SmartWater</div>
          </Link>
          <div className="text-sm text-slate-600">
            New here?{" "}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
              Create an account
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/70 shadow-sm">
              Welcome back
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
              Sign in to{" "}
              <span className="bg-gradient-to-r from-brand-700 to-sky-500 bg-clip-text text-transparent">
                SmartWater
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              Access your dashboard, usage analytics, and personalized water-saving recommendations.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Card className="public-card-hover public-reveal border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-4" style={{ animationDelay: "60ms" }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">Response Time</div>
                <div className="mt-1 text-2xl font-black text-slate-900">&lt; 24h</div>
                <div className="mt-1 text-xs text-slate-500">Support for account and setup issues.</div>
              </Card>
              <Card className="public-card-hover public-reveal border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-4" style={{ animationDelay: "100ms" }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Privacy First</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" /> Secured account access
                </div>
              </Card>
              <Card className="public-card-hover public-reveal border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4" style={{ animationDelay: "140ms" }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">Carbon Impact</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Leaf className="h-4 w-4 text-amber-600" /> Track and reduce footprint
                </div>
              </Card>
              <Card className="public-card-hover public-reveal border border-slate-200 bg-gradient-to-br from-slate-50 to-zinc-100 p-4" style={{ animationDelay: "180ms" }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">Availability</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Clock3 className="h-4 w-4 text-slate-600" /> Anytime dashboard access
                </div>
              </Card>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="public-card-hover p-7 sm:p-9">
              <div className="text-lg font-extrabold text-slate-900">Login</div>
              <div className="mt-1 text-sm text-slate-600">Use your email and password.</div>

              {error ? (
                <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
                  {error}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Email</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    className="mt-2 h-11 w-full rounded-xl bg-white/80 px-4 text-sm ring-1 ring-slate-200/70 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">Password</label>
                  <div className="relative mt-2">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={show ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 w-full rounded-xl bg-white/80 px-4 pr-12 text-sm ring-1 ring-slate-200/70 focus:outline-none focus:ring-2 focus:ring-brand-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShow((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 hover:text-slate-900"
                      aria-label={show ? "Hide password" : "Show password"}
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in"}
                </Button>

                <div className="text-center text-sm text-slate-600">
                  Don’t have an account?{" "}
                  <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
                    Register
                  </Link>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

