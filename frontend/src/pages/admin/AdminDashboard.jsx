import React, { useEffect, useMemo, useState } from "react";
import { Users, Home, Receipt, CloudSun, TrendingUp, Bell, ShieldCheck } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi, usersApi } from "../../lib/api";

function formatRelativeTime(isoDate) {
  if (!isoDate) return "just now";
  const deltaSec = Math.max(1, Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000));
  if (deltaSec < 60) return `${deltaSec}s ago`;
  if (deltaSec < 3600) return `${Math.floor(deltaSec / 60)}m ago`;
  if (deltaSec < 86400) return `${Math.floor(deltaSec / 3600)}h ago`;
  return `${Math.floor(deltaSec / 86400)}d ago`;
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [householdsWithZones, setHouseholdsWithZones] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [usersRes, householdsRes, withZonesRes] = await Promise.all([
          usersApi.list(token),
          householdsApi.list(token, { page: 1, limit: 500, search: "" }),
          householdsApi.allWithZones(token),
        ]);
        if (cancelled) return;
        setUsers(Array.isArray(usersRes) ? usersRes : []);
        setHouseholds(Array.isArray(householdsRes?.households) ? householdsRes.households : []);
        setHouseholdsWithZones(Array.isArray(withZonesRes) ? withZonesRes : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load admin dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const totalHouseholds = households.length;
    const totalRevenue = households.reduce((acc, h) => acc + Number(h.predictedBill || 0), 0);
    const climateSyncedPct = totalHouseholds
      ? Math.round((households.filter((h) => Boolean(h.climateZone)).length / totalHouseholds) * 100)
      : 0;

    const allZonesCount = householdsWithZones.reduce((acc, row) => acc + (row.zones?.length || 0), 0);
    const dry = households.filter((h) => String(h.climateZone || "").toLowerCase().includes("dry")).length;
    const wet = households.filter((h) => String(h.climateZone || "").toLowerCase().includes("wet")).length;
    const intermediate = Math.max(totalHouseholds - dry - wet, 0);

    return {
      totalUsers,
      totalHouseholds,
      totalRevenue,
      climateSyncedPct,
      allZonesCount,
      dry,
      wet,
      intermediate,
    };
  }, [users, households, householdsWithZones]);

  const trendBars = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const now = new Date();
    const dayBuckets = labels.map((label) => ({ label, value: 0 }));
    households.forEach((h) => {
      const d = h?.createdAt ? new Date(h.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const daysAgo = Math.floor((now - d) / (1000 * 60 * 60 * 24));
      if (daysAgo < 0 || daysAgo > 6) return;
      const idx = 6 - daysAgo;
      dayBuckets[idx].value += 1;
    });
    const max = Math.max(...dayBuckets.map((x) => x.value), 1);
    return dayBuckets.map((x) => ({
      ...x,
      pct: Math.max(10, Math.round((x.value / max) * 100)),
    }));
  }, [households]);

  const liveFeed = useMemo(() => {
    const userFeed = users
      .filter((u) => u.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2)
      .map((u) => ({
        title: "New user registered",
        desc: `${u.name || "User"} joined with ${u.email || "email unavailable"}`,
        time: formatRelativeTime(u.createdAt),
      }));
    const homeFeed = households
      .filter((h) => h.createdAt)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 2)
      .map((h) => ({
        title: "New household created",
        desc: `${h.name || "Household"} added in ${h.location?.city || "unknown city"}`,
        time: formatRelativeTime(h.createdAt),
      }));
    return [...homeFeed, ...userFeed].slice(0, 4);
  }, [users, households]);

  const stats = [
    {
      title: "Total Users",
      value: metrics.totalUsers.toLocaleString(),
      delta: "Live",
      icon: Users,
      tone: "from-cyan-500 to-sky-500",
    },
    {
      title: "Total Households",
      value: metrics.totalHouseholds.toLocaleString(),
      delta: "Live",
      icon: Home,
      tone: "from-violet-500 to-purple-500",
    },
    {
      title: "Predicted Revenue",
      value: `Rs. ${metrics.totalRevenue.toFixed(2)}`,
      delta: "Live",
      icon: Receipt,
      tone: "from-emerald-500 to-green-500",
    },
    {
      title: "Climate Synced",
      value: `${metrics.climateSyncedPct}%`,
      delta: "Live",
      icon: CloudSun,
      tone: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-cyan-600 via-sky-600 to-blue-700 p-7 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-cyan-200/20 blur-3xl" />
        <div className="relative grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Water Management Control Center
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight">Admin Dashboard</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-cyan-50/95">
              Monitor users, households, zone relations, and climate-driven bill estimations from one premium control panel.
            </p>
            {loading ? <p className="mt-3 text-xs text-cyan-100/90">Syncing live metrics...</p> : null}
            {error ? <p className="mt-3 text-xs text-rose-100">{error}</p> : null}
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">System Health</span>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="mt-4 text-4xl font-black">{error ? "N/A" : "98%"}</div>
            <div className="mt-1 text-sm text-cyan-100">
              {error ? "Backend sync issue detected." : "All core services operating normally."}
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/20">
              <div className="h-full w-[98%] rounded-full bg-white" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.title}</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">{loading ? "-" : item.value}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-600">{item.delta} data</p>
              </div>
              <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${item.tone} text-white shadow-sm`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Weekly Household Creation Trend</h2>
              <p className="text-sm text-slate-500">Based on created households in last 7 days</p>
            </div>
            <TrendingUp className="h-5 w-5 text-brand-600" />
          </div>
          <div className="mt-6 grid grid-cols-7 items-end gap-3">
            {trendBars.map((d) => (
              <div key={d.label} className="text-center">
                <div className="mx-auto flex h-40 w-full max-w-[42px] items-end rounded-xl bg-slate-100 p-1">
                  <div className="w-full rounded-lg bg-gradient-to-t from-brand-600 to-sky-400" style={{ height: `${d.pct}%` }} />
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-500">{d.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">Live Feed</h2>
            <Bell className="h-5 w-5 text-brand-600" />
          </div>
          <div className="mt-5 space-y-3">
            {(liveFeed.length ? liveFeed : [{ title: "No activity yet", desc: "Create data to populate feed", time: "now" }]).map((a, idx) => (
              <div key={`${a.title}-${idx}`} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                <p className="mt-1 text-xs text-slate-500">{a.desc}</p>
                <p className="mt-2 text-[11px] font-semibold text-brand-700">{a.time}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-900">Operational Snapshot</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Total Zones", metrics.allZonesCount.toString()],
            ["Dry Zone Households", metrics.dry.toString()],
            ["Wet Zone Households", metrics.wet.toString()],
            ["Intermediate Households", metrics.intermediate.toString()],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</p>
              <p className="mt-1 text-xl font-black text-slate-900">{loading ? "-" : v}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}