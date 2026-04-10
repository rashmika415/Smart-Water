import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Droplets,
  Gauge,
  Receipt,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi, usageApi } from "../../lib/api";
import { BrandLogo } from "../../components/BrandLogo";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatCard } from "../../components/StatCard";

function formatDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function formatDateLabel(dateKey) {
  if (!dateKey) return "";
  const date = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateKey;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function safeNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function TrendBars({ points }) {
  const max = Math.max(...points.map((p) => safeNumber(p.totalLiters || p.value || 0)), 1);
  const items = points.map((p) => ({
    label: p.label,
    value: safeNumber(p.totalLiters || p.value || 0),
  }));

  return (
    <div className="grid grid-cols-7 items-end gap-3">
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="mx-auto flex h-44 w-full max-w-[44px] items-end rounded-[20px] bg-slate-100 p-1.5">
            <div
              className="w-full rounded-[14px] bg-gradient-to-t from-sky-500 via-cyan-400 to-emerald-300"
              style={{ height: `${Math.max((item.value / max) * 100, 10)}%` }}
            />
          </div>
          <div className="mt-3 text-xs font-semibold text-slate-500">{item.label}</div>
          <div className="text-[11px] text-slate-400">{item.value.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}

export function UserDashboard() {
  const { token, user } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState("");
  const [trend, setTrend] = useState([]);

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

  const loadTrend = useCallback(async () => {
    if (!token) return;
    setTrendLoading(true);
    setTrendError("");
    try {
      const res = await usageApi.dailyWaterUsage(token, { days: 7 });
      const raw = res?.data?.trend;
      if (!Array.isArray(raw)) {
        // Some backends only return averageDailyUsage; we fall back to empty.
        setTrend([]);
        setTrendLoading(false);
        return;
      }
      const normalized = raw
        .map((item) => ({
          date: String(item?.date || item?._id || ""),
          totalLiters: safeNumber(item?.totalLiters || item?.liters || item?.value || 0),
        }))
        .filter((item) => item.date)
        .slice(-7);

      setTrend(normalized);
    } catch (err) {
      setTrendError(err?.message || "Failed to load usage trend.");
      setTrend([]);
    } finally {
      setTrendLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTrend();
  }, [loadTrend]);

  const summary = useMemo(() => {
    const totalHouseholds = households.length;
    const liters = households.reduce((a, h) => a + Number(h.estimatedMonthlyLiters || 0), 0);
    const units = households.reduce((a, h) => a + Number(h.estimatedMonthlyUnits || 0), 0);
    const bill = households.reduce((a, h) => a + Number(h.predictedBill || 0), 0);
    return { totalHouseholds, liters, units, bill };
  }, [households]);

  const recentTrendPoints = useMemo(() => {
    // Prefer backend trend if available; otherwise build a 7-day window of zeros.
    const now = new Date();
    const byDate = new Map(trend.map((item) => [item.date, item]));
    const out = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = formatDateKey(d);
      const found = byDate.get(key);
      out.push({
        label: formatDateLabel(key),
        totalLiters: safeNumber(found?.totalLiters || 0),
      });
    }
    return out;
  }, [trend]);

  const weeklyTotalLiters = useMemo(
    () => recentTrendPoints.reduce((sum, item) => sum + safeNumber(item.totalLiters || 0), 0),
    [recentTrendPoints]
  );

  const avgDailyLiters = weeklyTotalLiters ? weeklyTotalLiters / 7 : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 p-6 text-white shadow-[0_30px_90px_-40px_rgba(2,132,199,0.65)] sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.28),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.20),transparent_24%)]" />
        <div className="relative grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur">
              <BrandLogo className="h-8 w-8" alt="" />
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100">
                Smart Water Premium Dashboard
              </span>
            </div>

            <h1 className="mt-6 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl xl:text-[42px]">
              Welcome{user?.name ? `, ${user.name}` : ""}. Your usage insights just got upgraded.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white sm:text-base">
              See weekly usage signals, keep an eye on billing estimates, and jump into analytics and
              maintenance updates from one modern home screen.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Households
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">
                  {loading ? "-" : summary.totalHouseholds.toLocaleString()}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Weekly total (L)
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">
                  {trendLoading ? "-" : weeklyTotalLiters.toLocaleString()}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Avg/day (L)
                </div>
                <div className="mt-2 text-2xl font-black tracking-tight text-white">
                  {trendLoading ? "-" : Math.round(avgDailyLiters).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <Card className="border border-white/10 bg-white/10 p-5 text-white ring-0 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Efficiency score</div>
              <Sparkles className="h-5 w-5 text-emerald-300" />
            </div>
            <div className="mt-4 text-5xl font-black tracking-tight text-white">
              {summary.totalHouseholds > 0 ? "72%" : "0%"}
            </div>
            <p className="mt-2 text-sm text-white">
              A simple placeholder score based on connected households. (We can replace this with a
              real backend score later.)
            </p>
            <div className="mt-4 h-2 rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300" />
            </div>
          </Card>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total households" value={summary.totalHouseholds} subtitle="Registered by you" icon={Activity} />
        <StatCard title="Estimated liters" value={summary.liters.toLocaleString()} subtitle="Monthly total" icon={Droplets} />
        <StatCard title="Estimated units" value={summary.units.toFixed(2)} subtitle="m^3 monthly total" icon={Gauge} />
        <StatCard title="Predicted bill" value={summary.bill.toFixed(2)} subtitle="Monthly estimate" icon={Receipt} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="border border-slate-200/80 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Weekly usage
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Water usage trend (last 7 days)
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Powered by your usage records ({trendLoading ? "loading..." : "live"}).
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <TrendingUp className="h-5 w-5 text-sky-700" />
            </div>
          </div>

          {trendError ? (
            <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {trendError}
            </div>
          ) : null}

          <div className="mt-8">
            <TrendBars points={recentTrendPoints} />
          </div>
        </Card>

        <Card className="border border-slate-200/80 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Quick actions
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Jump back in
              </h2>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3">
              <Activity className="h-5 w-5 text-slate-700" />
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {[
              { to: "/user/usage", title: "Usage history", body: "Review, filter, and manage your water logs." },
              { to: "/user/carbon-analytics", title: "Carbon analytics", body: "See trends and drill down by activity." },
              { to: "/user/estimated-bill", title: "Estimated bill", body: "Check monthly billing estimation details." },
              { to: "/user/activities", title: "Maintenance updates", body: "View scheduled and completed maintenance." },
            ].map((item) => (
              <div key={item.to} className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-100">
                <div className="text-sm font-bold text-slate-900">{item.title}</div>
                <div className="mt-1 text-sm text-slate-500">{item.body}</div>
                <Button as={Link} to={item.to} size="sm" className="mt-3 w-full">
                  Open <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { to: "/user/profile", title: "View Profile", body: "View and update account details." },
          { to: "/user/households", title: "My Households", body: "Manage your households and zones." },
          { to: "/user/estimated-bill", title: "Estimated Bill", body: "Understand billing calculations." },
          { to: "/user/weather-insights", title: "Weather Insights", body: "See climate zone effects." },
        ].map((x) => (
          <Card key={x.to} className="p-6">
            <div className="text-base font-extrabold text-slate-900">{x.title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{x.body}</p>
            <Button as={Link} to={x.to} className="mt-5 w-full gap-2" size="lg">
              Open <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading latest household summary...</p> : null}
    </div>
  );
}
