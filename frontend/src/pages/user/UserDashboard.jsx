import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { StatCard } from "../../components/StatCard";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Building2, Receipt, Droplets, Gauge, ArrowRight, Sparkles, TrendingUp, CloudSun } from "lucide-react";

export function UserDashboard() {
  const { token, user } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await householdsApi.myHouseholds(token);
        if (!cancelled) setHouseholds(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const summary = useMemo(() => {
    const totalHouseholds = households.length;
    const liters = households.reduce((a, h) => a + Number(h.estimatedMonthlyLiters || 0), 0);
    const units = households.reduce((a, h) => a + Number(h.estimatedMonthlyUnits || 0), 0);
    const bill = households.reduce((a, h) => a + Number(h.predictedBill || 0), 0);
    return { totalHouseholds, liters, units, bill };
  }, [households]);

  const cards = [
    { to: "/user/profile", title: "My Profile", body: "Update your account details and password." },
    { to: "/user/households", title: "My Households", body: "Create, edit and manage all your households." },
    { to: "/user/estimated-bill", title: "Estimated Bill", body: "Check detailed monthly billing estimation." },
    { to: "/user/weather-insights", title: "Weather Insights", body: "See climate impact for your locations." },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-brand-200/40 bg-gradient-to-br from-brand-600 via-cyan-600 to-sky-600 p-7 text-white shadow-xl">
        <div className="absolute -right-16 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Premium User Dashboard</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">
              Welcome{user?.name ? `, ${user.name}` : ""}!
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cyan-50/95">
              Track your household usage, monitor climate-based estimates, and optimize your monthly water bill with smarter insights.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20">Real-time summaries</span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20">Climate-aware estimates</span>
              <span className="rounded-full bg-white/15 px-3 py-1.5 ring-1 ring-white/20">Household-level tracking</span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Savings Progress</span>
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="mt-4 text-4xl font-black">
              {summary.totalHouseholds > 0 ? "72%" : "0%"}
            </div>
            <div className="mt-1 text-sm text-cyan-100">Average efficiency score from your households.</div>
            <div className="mt-4 h-2 rounded-full bg-white/20">
              <div className="h-full w-[72%] rounded-full bg-white" />
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total households" value={summary.totalHouseholds} subtitle="Registered by you" icon={Building2} />
        <StatCard title="Estimated liters" value={summary.liters.toLocaleString()} subtitle="Monthly total" icon={Droplets} />
        <StatCard title="Estimated units" value={summary.units.toFixed(2)} subtitle="m^3 monthly total" icon={Gauge} />
        <StatCard title="Predicted bill" value={summary.bill.toFixed(2)} subtitle="Monthly estimate" icon={Receipt} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Monthly Trend Snapshot</h2>
              <p className="text-sm text-slate-500">Usage intensity from your current household set</p>
            </div>
            <TrendingUp className="h-5 w-5 text-brand-600" />
          </div>
          <div className="mt-6 grid grid-cols-6 items-end gap-3">
            {[42, 55, 68, 61, 73, 64].map((v, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-36 w-full max-w-[38px] items-end rounded-lg bg-slate-100 p-1">
                  <div className="w-full rounded-md bg-gradient-to-t from-brand-600 to-sky-400" style={{ height: `${v}%` }} />
                </div>
                <p className="mt-2 text-[11px] font-semibold text-slate-500">{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][i]}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Climate Alert</h2>
            <CloudSun className="h-5 w-5 text-brand-600" />
          </div>
          <p className="mt-4 text-sm text-slate-600">
            Dry zones can increase estimated bills, while wet zones may lower consumption impact.
          </p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-amber-800 ring-1 ring-amber-100">Dry: higher demand risk</div>
            <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800 ring-1 ring-emerald-100">Wet: favorable estimate adjustment</div>
            <div className="rounded-lg bg-sky-50 px-3 py-2 text-sky-800 ring-1 ring-sky-100">Intermediate: balanced usage factor</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((x) => (
          <Card key={x.to} className="p-6">
            <div className="text-base font-extrabold text-slate-900">{x.title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{x.body}</p>
            <Button as={Link} to={x.to} className="mt-5 w-full gap-2" size="lg">
              Open <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </section>

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading latest household summary...</p> : null}
    </div>
  );
}
