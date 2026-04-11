import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Gauge,
  Leaf,
  Receipt,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Navbar, Footer } from "../components/SiteShell";
import { BrandLogo } from "../components/BrandLogo";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAuth } from "../auth/AuthContext";
import { householdsApi, usageApi } from "../lib/api";

function formatDateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function buildWindowedTrend(rawTrend, days) {
  const safeDays = Math.max(1, Number(days || 1));
  const map = new Map(
    (Array.isArray(rawTrend) ? rawTrend : []).map((item) => [
      String(item?.date || ""),
      {
        totalLiters: Number(item?.totalLiters || 0),
        totalCarbonKg: Number(item?.totalCarbonKg || 0),
      },
    ])
  );

  const end = new Date();
  const out = [];

  for (let i = safeDays - 1; i >= 0; i -= 1) {
    const date = new Date(end);
    date.setDate(end.getDate() - i);
    const key = formatDateKey(date);
    const found = map.get(key);
    out.push({
      date: key,
      totalLiters: Number(found?.totalLiters || 0),
      totalCarbonKg: Number(found?.totalCarbonKg || 0),
    });
  }

  return out;
}

function SectionHeader({ title, subtitle, badge }) {
  return (
    <div className="border-b border-slate-200/70 bg-gradient-to-r from-sky-50/70 via-white to-emerald-50/60 px-5 py-4 sm:px-6">
      {badge ? (
        <div className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {badge}
        </div>
      ) : null}
      <h2 className="mt-2 text-lg font-black tracking-tight text-slate-900 sm:text-xl">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
    </div>
  );
}

function Reveal({ children, delay = 0, className = "" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(10px)",
        transition: "opacity 560ms ease, transform 560ms ease",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function LandingFeature({ icon: Icon, title, body }) {
  return (
    <div className="h-full rounded-2xl bg-white/80 p-3.5 ring-1 ring-slate-200/80 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-30px_rgba(15,23,42,0.55)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200/80">
          <Icon className="h-5 w-5 text-brand-700" />
        </span>
        <div>
          <div className="text-base font-black tracking-tight text-slate-900">{title}</div>
          <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
        </div>
      </div>
    </div>
  );
}

function VirtualMeterLandingIntro({ token }) {
  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-sky-100/80 via-slate-50 to-emerald-100/70 p-0 ring-1 ring-slate-200/80">
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="relative min-h-[300px] lg:min-h-[500px]">
          <img
            src="/virtualmeter.jpg"
            alt="Virtual water meter"
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-slate-900/20 via-transparent to-sky-200/20" />

          <div className="absolute left-4 top-4 rounded-2xl bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/80 backdrop-blur-sm">
            Live stream status
          </div>
          <div className="absolute right-4 top-4 rounded-2xl bg-white/90 px-4 py-2 text-base font-black text-emerald-700 ring-1 ring-emerald-200/80 backdrop-blur-sm">
            2.4 L/min
          </div>
          <div className="absolute bottom-4 left-4 rounded-2xl bg-white/90 px-5 py-3 ring-1 ring-slate-200/80 backdrop-blur-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Daily goal</div>
            <div className="mt-1 text-3xl font-black text-emerald-700">70%</div>
            <div className="text-sm text-slate-600">84/120 L</div>
          </div>
          <div className="absolute bottom-4 right-4 rounded-2xl bg-white/90 px-4 py-2 text-xl font-black text-emerald-700 ring-1 ring-emerald-200/80 backdrop-blur-sm">
            Optimal
          </div>
        </div>

        <div className="p-5 sm:p-7 lg:p-8">
          <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800 ring-1 ring-emerald-200/70">
            {token ? "Personal Virtual Meter" : "Public Virtual Meter"}
          </div>

          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            Real-Time Water
            <span className="text-emerald-600"> Monitoring</span>
          </h1>

          <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
            Track household consumption patterns, detect spikes early, and manage water goals from one clean dashboard.
          </p>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {token ? (
              <>
                <Button as={Link} to="/user/water-activities" size="lg">Go to Water Activities</Button>
                <Button as={Link} to="/user/carbon-analytics" variant="ghost" size="lg">Open Carbon Analytics</Button>
              </>
            ) : (
              <>
                <Button as={Link} to="/register" size="lg">Create Account</Button>
                <Button as={Link} to="/login" variant="ghost" size="lg">Login</Button>
              </>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <LandingFeature
              icon={BrandLogo}
              title="Per-Tap Tracking"
              body="Monitor each activity source clearly with liters and footprint impact."
            />
            <LandingFeature
              icon={ShieldCheck}
              title="Leak Detection"
              body="Get early warnings when daily usage rises above normal baseline."
            />
            <LandingFeature
              icon={TrendingUp}
              title="Usage History"
              body="Compare recent trends to understand behavior changes over time."
            />
            <LandingFeature
              icon={Activity}
              title="Live Dashboard"
              body="View real-time status, monthly progress, and optimization guidance."
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

function PublicEstimator() {
  const [residents, setResidents] = useState(3);
  const [propertyType, setPropertyType] = useState("house");
  const [climateZone, setClimateZone] = useState("intermediate");

  const estimate = useMemo(() => {
    const residentBase = 85;
    const propertyFactor = propertyType === "apartment" ? 0.9 : 1;
    const climateFactor =
      climateZone === "dry" ? 1.15 : climateZone === "wet" ? 0.9 : 1;

    const dailyLiters = Math.round(residents * residentBase * propertyFactor * climateFactor);
    const monthlyLiters = dailyLiters * 30;
    const monthlyCarbonKg = Number((monthlyLiters * 0.00052).toFixed(3));
    const monthlyBill = Number(((monthlyLiters / 1000) * 125).toFixed(2));

    return { dailyLiters, monthlyLiters, monthlyCarbonKg, monthlyBill };
  }, [residents, propertyType, climateZone]);

  return (
    <Card className="overflow-hidden border-0 bg-white/90 p-0 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/80">
      <SectionHeader
        badge="Guest Mode"
        title="Public Virtual Meter"
        subtitle="Estimate household usage before creating an account."
      />

      <div className="p-5 sm:p-6">

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Residents</label>
          <input
            type="number"
            min={1}
            value={residents}
            onChange={(e) => setResidents(Math.max(1, Number(e.target.value || 1)))}
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Property type</label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Climate zone</label>
          <select
            value={climateZone}
            onChange={(e) => setClimateZone(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
          >
            <option value="dry">Dry</option>
            <option value="intermediate">Intermediate</option>
            <option value="wet">Wet</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Estimated daily liters" value={`${estimate.dailyLiters.toLocaleString()} L`} icon={BrandLogo} />
        <Metric title="Estimated monthly liters" value={`${estimate.monthlyLiters.toLocaleString()} L`} icon={Gauge} />
        <Metric title="Estimated monthly carbon" value={`${estimate.monthlyCarbonKg.toFixed(3)} kg`} icon={Leaf} />
        <Metric title="Estimated monthly bill" value={`${estimate.monthlyBill.toFixed(2)}`} icon={Receipt} />
      </div>

      <Card className="mt-4 border-0 bg-slate-50/90 p-3.5 ring-1 ring-slate-200/70">
        <div className="text-sm font-extrabold text-slate-900">How this estimate works</div>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
          <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200/70">Based on residents, property type, and climate.</div>
          <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200/70">Uses average water-carbon conversion factors.</div>
          <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200/70">Your personal meter becomes available after login.</div>
        </div>
      </Card>

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-2.5 text-xs text-slate-600 ring-1 ring-slate-200/70">
        Estimate mode: calculated from selected inputs, baseline usage assumptions, and average local water-carbon factors.
      </div>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Button as={Link} to="/register" size="lg">Create Account</Button>
        <Button as={Link} to="/login" variant="ghost" size="lg">Login</Button>
        <Button as={Link} to="/" variant="ghost" size="lg">Back to Home</Button>
      </div>

      <Card className="mt-5 border-0 bg-white p-3.5 ring-1 ring-slate-200/70">
        <div className="text-sm font-extrabold text-slate-900">After login, you get</div>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Live personal usage and monthly goal tracking.</div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Spike alerts, diagnostics, and quick actions.</div>
        </div>
      </Card>
      </div>
    </Card>
  );
}

function Metric({ title, value, icon: Icon }) {
  return (
    <Card className="h-full border-0 bg-white p-4 ring-1 ring-slate-200/70 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-30px_rgba(15,23,42,0.55)]">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-slate-200/70">
          <Icon className="h-4 w-4 text-brand-700" />
        </span>
      </div>
      <div className="mt-2 text-lg font-black text-slate-900 sm:text-xl">{value}</div>
    </Card>
  );
}

function PrivateMeter() {
  const { token } = useAuth();
  const [trendDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [recent, setRecent] = useState([]);
  const [monthFallbackTotals, setMonthFallbackTotals] = useState({ liters: 0, carbonKg: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = monthStart.toISOString();
    const endDate = now.toISOString();

    try {
      const [statsRes, trendRes, householdsRes, recentRes, monthUsagesRes] = await Promise.all([
        usageApi.carbonStats(token, { startDate, endDate }),
        usageApi.carbonTrend(token, { days: trendDays }),
        householdsApi.myHouseholds(token),
        usageApi.list(token, { page: 1, limit: 5, sort: "-occurredAt" }),
        usageApi.list(token, { page: 1, limit: 1000, startDate, endDate, sort: "-occurredAt" }),
      ]);

      setStats(statsRes?.data || null);
      setTrend(buildWindowedTrend(trendRes?.data?.trend, trendDays));
      setHouseholds(Array.isArray(householdsRes) ? householdsRes : []);
      setRecent(Array.isArray(recentRes?.data) ? recentRes.data : []);
      const monthUsageRows = Array.isArray(monthUsagesRes?.data) ? monthUsagesRes.data : [];
      const fallbackLiters = monthUsageRows.reduce((sum, item) => sum + Number(item?.liters || 0), 0);
      const fallbackCarbonKg = monthUsageRows.reduce(
        (sum, item) => sum + Number(item?.carbonFootprint?.carbonKg || 0),
        0
      );
      setMonthFallbackTotals({
        liters: fallbackLiters,
        carbonKg: Number(fallbackCarbonKg.toFixed(3)),
      });
    } catch (e) {
      setError(e?.message || "Failed to load virtual meter data");
      setStats(null);
      setTrend([]);
      setHouseholds([]);
      setRecent([]);
      setMonthFallbackTotals({ liters: 0, carbonKg: 0 });
    } finally {
      setLoading(false);
    }
  }, [token, trendDays]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const statsLiters = Number(stats?.current?.totalLiters || 0);
    const statsCarbon = Number(stats?.current?.totalCarbonKg || 0);
    const totalLiters = statsLiters > 0 ? statsLiters : Number(monthFallbackTotals.liters || 0);
    const totalCarbon = statsCarbon > 0 ? statsCarbon : Number(monthFallbackTotals.carbonKg || 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = trend.find((t) => t.date === today);
    const todayLiters = Number(todayEntry?.totalLiters || 0);
    const targetLiters = households.reduce((sum, h) => sum + Number(h.estimatedMonthlyLiters || 0), 0) || 1;
    const billForecast = households.reduce((sum, h) => sum + Number(h.predictedBill || 0), 0);
    const progress = Math.min((totalLiters / targetLiters) * 100, 100);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const elapsedRatio = Math.max(dayOfMonth / daysInMonth, 0.01);
    const projectedMonthLiters = totalLiters / elapsedRatio;
    const projectedMonthCarbon = totalCarbon / elapsedRatio;
    const litersDeltaToTarget = projectedMonthLiters - targetLiters;
    const budgetStatus = litersDeltaToTarget > 0 ? "Above target" : "Within target";

    return {
      totalLiters,
      totalCarbon,
      todayLiters,
      targetLiters,
      billForecast,
      progress,
      projectedMonthLiters,
      projectedMonthCarbon,
      litersDeltaToTarget,
      budgetStatus,
    };
  }, [stats, trend, households, monthFallbackTotals]);

  const trendSummary = useMemo(() => {
    if (!trend.length) {
      return {
        recentAverageLiters: 0,
        spikeRatio: 0,
        hasSpike: false,
        todayLiters: 0,
        lastThreeDays: [],
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const historical = trend.filter((t) => t.date !== today);
    const source = historical.length ? historical : trend;
    const avg = source.reduce((sum, d) => sum + Number(d.totalLiters || 0), 0) / Math.max(source.length, 1);
    const todayEntry = trend.find((t) => t.date === today);
    const todayLiters = Number(todayEntry?.totalLiters || 0);
    const ratio = avg > 0 ? todayLiters / avg : 0;
    const lastThreeDays = trend.slice(-3).map((d) => ({
      date: d.date,
      liters: Number(d.totalLiters || 0),
    }));

    return {
      recentAverageLiters: avg,
      spikeRatio: ratio,
      hasSpike: avg > 0 && ratio >= 1.3,
      todayLiters,
      lastThreeDays,
    };
  }, [trend]);

  return (
    <Card className="overflow-hidden border-0 bg-white/90 p-0 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.55)] ring-1 ring-slate-200/80">
      <SectionHeader
        badge="Signed In"
        title="Personal Virtual Meter"
        subtitle="Live from your usage records and household profiles."
      />

      <div className="p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black tracking-tight text-slate-900">Real-time usage cockpit</h3>
          <p className="mt-1 text-sm text-slate-600">Track daily flow, risk signals, and optimization opportunities in one view.</p>
        </div>
        <Button variant="ghost" onClick={load}>Refresh</Button>
      </div>

      {error ? <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">{error}</div> : null}
      {loading ? <p className="mt-4 text-sm text-slate-500">Loading your meter...</p> : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Today usage" value={`${summary.todayLiters.toLocaleString()} L`} icon={BrandLogo} />
        <Metric title="This month usage" value={`${summary.totalLiters.toLocaleString()} L`} icon={Gauge} />
        <Metric title="This month carbon" value={`${summary.totalCarbon.toFixed(3)} kg`} icon={Leaf} />
        <Metric title="Bill forecast" value={summary.billForecast.toFixed(2)} icon={Receipt} />
      </div>

      <Card className="mt-4 border-0 bg-slate-50/90 p-3.5 ring-1 ring-slate-200/70">
        <div className="text-sm font-extrabold text-slate-900">Quick status</div>
        <div className="mt-2 text-sm text-slate-600">
          Budget: <span className="font-semibold text-slate-900">{summary.budgetStatus}</span>
          {" · "}
          Projection: <span className="font-semibold text-slate-900">{Math.round(summary.projectedMonthLiters).toLocaleString()} L</span>
          {" · "}
          Spike check: <span className="font-semibold text-slate-900">{trendSummary.hasSpike ? "Attention needed" : "Normal"}</span>
        </div>
      </Card>

      {trendSummary.hasSpike ? (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800 ring-1 ring-amber-100">
          Potential usage spike: today is {Math.round((trendSummary.spikeRatio - 1) * 100)}% above your recent average ({Math.round(trendSummary.recentAverageLiters)} L/day). Check taps and toilets for leaks.
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800 ring-1 ring-emerald-100">
          Usage status normal: today is within your recent baseline ({Math.round(trendSummary.recentAverageLiters)} L/day).
        </div>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2 lg:items-stretch">
        <Card className="h-full border-0 bg-white p-4 ring-1 ring-slate-200/70">
          <div className="text-sm font-extrabold text-slate-900">Recent activities</div>
          {recent.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No activities yet. Add your first usage record.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {recent.map((r) => (
                <div key={r._id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="font-medium text-slate-800">{r.activityType}</span>
                  <span className="text-slate-600">{Number(r.liters || 0).toLocaleString()} L</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="h-full border-0 bg-white p-4 ring-1 ring-slate-200/70">
          <div className="text-sm font-extrabold text-slate-900">Quick actions</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-1">
            <Button as={Link} to="/dashboard" className="gap-2" size="sm">
              <TrendingUp className="h-4 w-4" /> Go to Dashboard
            </Button>
            <Button as={Link} to="/user/water-activities" className="gap-2" size="sm">
              <Activity className="h-4 w-4" /> Add activity
            </Button>
            <Button as={Link} to="/user/carbon-analytics" variant="ghost" size="sm" className="gap-2">
              <ShieldCheck className="h-4 w-4" /> View analytics
            </Button>
          </div>
        </Card>
      </div>
      </div>
    </Card>
  );
}

export function VirtualMeterPage() {
  const { token } = useAuth();

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(180deg,#f5fbff_0%,#eaf7f0_42%,#f7fafc_100%)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_86%_10%,rgba(16,185,129,0.16),transparent_36%),radial-gradient(circle_at_50%_100%,rgba(15,23,42,0.08),transparent_40%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(148,163,184,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.18)_1px,transparent_1px)] [background-size:26px_26px]"
      />
      <Navbar />
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Reveal delay={30}>
          <VirtualMeterLandingIntro token={token} />
        </Reveal>

        <Reveal delay={200} className="mt-6">
          {token ? <PrivateMeter /> : <PublicEstimator />}
        </Reveal>
      </div>
      <Footer />
    </div>
  );
}
