import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock3, Eye, EyeOff, Sparkles, Target } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { BrandLogo } from "../components/BrandLogo";
import { useAuth } from "../auth/AuthContext";

export function RegisterPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await register({ name, email, password, role: "user" });
      setSuccess("Account created. Logging you in...");
      await login({ email, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#ecfbff_0%,#ffffff_54%,#f3fbf6_100%)] px-4 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(14,165,233,0.16),transparent_36%),radial-gradient(circle_at_86%_12%,rgba(16,185,129,0.14),transparent_34%)]"
      />
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <BrandLogo className="h-10 w-10" alt="" />
            <div className="text-sm font-extrabold text-slate-900">SmartWater</div>
          </Link>
          <div className="text-sm text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
              Login
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/70 shadow-sm">
              Create account
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900">
              Start saving water with{" "}
              <span className="bg-gradient-to-r from-brand-700 to-sky-500 bg-clip-text text-transparent">
                SmartWater
              </span>
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              Track usage, set goals, and unlock personalized conservation tips designed for your
              household.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Card className="public-card-hover public-reveal border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-4" style={{ animationDelay: "60ms" }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-700">Quick Setup</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Clock3 className="h-4 w-4 text-sky-700" /> Start in under 1 minute
                </div>
              </Card>
              <Card className="public-card-hover public-reveal border border-emerald-100 bg-gradient-to-br from-emerald-50 to-lime-50 p-4" style={{ animationDelay: "100ms" }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Smart Goals</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Target className="h-4 w-4 text-emerald-600" /> Personalized saving targets
                </div>
              </Card>
              <Card className="public-card-hover public-reveal border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4" style={{ animationDelay: "140ms" }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">Actionable Tips</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">Daily recommendations tailored to usage.</div>
              </Card>
              <Card className="public-card-hover public-reveal border border-slate-200 bg-gradient-to-br from-slate-50 to-zinc-100 p-4" style={{ animationDelay: "180ms" }}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">Experience</div>
                <div className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="h-4 w-4 text-slate-700" /> Clean dashboard from day one
                </div>
              </Card>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="public-card-hover p-7 sm:p-9">
              <div className="text-lg font-extrabold text-slate-900">Register</div>
              <div className="mt-1 text-sm text-slate-600">It only takes a minute.</div>

              {error ? (
                <div className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
                  {success}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    type="text"
                    placeholder="Your name"
                    className="mt-2 h-11 w-full rounded-xl bg-white/80 px-4 text-sm ring-1 ring-slate-200/70 focus:outline-none focus:ring-2 focus:ring-brand-300"
                    required
                  />
                </div>

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
                      placeholder="At least 6 characters"
                      className="h-11 w-full rounded-xl bg-white/80 px-4 pr-12 text-sm ring-1 ring-slate-200/70 focus:outline-none focus:ring-2 focus:ring-brand-300"
                      minLength={6}
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
                  {loading ? "Creating..." : "Create account"}
                </Button>

                <div className="text-center text-sm text-slate-600">
                  By continuing, you agree to our{" "}
                  <span className="font-semibold text-slate-700">Terms</span> and{" "}
                  <span className="font-semibold text-slate-700">Privacy Policy</span>.
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

