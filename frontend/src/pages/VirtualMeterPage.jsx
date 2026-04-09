import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CalendarClock,
  Droplet,
  Gauge,
  Leaf,
  Receipt,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Navbar, Footer } from "../components/SiteShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAuth } from "../auth/AuthContext";
import { householdsApi, usageApi } from "../lib/api";

const MONTHLY_TARGET_STORAGE_KEY = "smartwater.virtualMeterMonthlyTarget";
const WEEKLY_GOALS_STORAGE_KEY = "smartwater.weeklyGoals";

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

function PublicEstimator() {
  const [residents, setResidents] = useState(3);
  const [propertyType, setPropertyType] = useState("house");
  const [climateZone, setClimateZone] = useState("intermediate");
  const [savingsPlan, setSavingsPlan] = useState("balanced");

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

  const estimatorInsights = useMemo(() => {
    const litersPerResident = estimate.dailyLiters / Math.max(residents, 1);
    const annualLiters = estimate.monthlyLiters * 12;
    const annualCarbon = estimate.monthlyCarbonKg * 12;

    const efficiencyBand =
      litersPerResident <= 75
        ? "Efficient"
        : litersPerResident <= 95
          ? "Moderate"
          : "High usage";

    return {
      litersPerResident,
      annualLiters,
      annualCarbon,
      efficiencyBand,
    };
  }, [estimate, residents]);

  const optimizedScenario = useMemo(() => {
    const savingRate =
      savingsPlan === "aggressive" ? 0.2 : savingsPlan === "balanced" ? 0.12 : 0.06;

    const projectedDaily = Math.max(1, Math.round(estimate.dailyLiters * (1 - savingRate)));
    const projectedMonthly = projectedDaily * 30;
    const monthlySavedLiters = Math.max(0, estimate.monthlyLiters - projectedMonthly);
    const monthlySavedCarbon = Number((monthlySavedLiters * 0.00052).toFixed(3));
    const monthlySavedBill = Number(((monthlySavedLiters / 1000) * 125).toFixed(2));

    return {
      savingRate,
      projectedDaily,
      projectedMonthly,
      monthlySavedLiters,
      monthlySavedCarbon,
      monthlySavedBill,
    };
  }, [estimate, savingsPlan]);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-black tracking-tight text-slate-900">Public Virtual Meter</h2>
      <p className="mt-1 text-sm text-slate-600">
        Estimate household usage before creating an account.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Estimated daily liters" value={`${estimate.dailyLiters.toLocaleString()} L`} icon={Droplet} />
        <Metric title="Estimated monthly liters" value={`${estimate.monthlyLiters.toLocaleString()} L`} icon={Gauge} />
        <Metric title="Estimated monthly carbon" value={`${estimate.monthlyCarbonKg.toFixed(3)} kg`} icon={Leaf} />
        <Metric title="Estimated monthly bill" value={`${estimate.monthlyBill.toFixed(2)}`} icon={Receipt} />
      </div>

      <Card className="mt-5 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Savings scenario simulator</div>
            <div className="mt-1 text-xs text-slate-500">Preview how behavior changes can reduce usage before signup.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "light", label: "Light" },
              { id: "balanced", label: "Balanced" },
              { id: "aggressive", label: "Aggressive" },
            ].map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSavingsPlan(plan.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  savingsPlan === plan.id
                    ? "bg-brand-100 text-brand-900 ring-1 ring-brand-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {plan.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current estimate</div>
            <div className="mt-2 text-lg font-black text-slate-900">{estimate.monthlyLiters.toLocaleString()} L/month</div>
            <div className="mt-1 text-xs text-slate-500">Baseline from current household inputs.</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">With {savingsPlan} plan</div>
            <div className="mt-2 text-lg font-black text-emerald-900">{optimizedScenario.projectedMonthly.toLocaleString()} L/month</div>
            <div className="mt-1 text-xs text-emerald-800">
              Save {optimizedScenario.monthlySavedLiters.toLocaleString()} L, {optimizedScenario.monthlySavedCarbon.toFixed(3)} kg CO2, and {optimizedScenario.monthlySavedBill.toFixed(2)} /month.
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Sparkles className="h-4 w-4 text-amber-500" /> Efficiency band
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{estimatorInsights.efficiencyBand}</div>
          <div className="mt-1 text-xs text-slate-500">
            {estimatorInsights.litersPerResident.toFixed(1)} L/resident/day based on current assumptions.
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <CalendarClock className="h-4 w-4 text-sky-500" /> Annual projection
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{Math.round(estimatorInsights.annualLiters).toLocaleString()} L</div>
          <div className="mt-1 text-xs text-slate-500">Estimated yearly volume at current household profile.</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Leaf className="h-4 w-4 text-emerald-500" /> Annual carbon estimate
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{estimatorInsights.annualCarbon.toFixed(2)} kg</div>
          <div className="mt-1 text-xs text-slate-500">Useful for setting sustainability targets before signup.</div>
        </Card>
      </div>

      <Card className="mt-5 p-4">
        <div className="text-sm font-extrabold text-slate-900">How to lower this estimate quickly</div>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
          <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Shorten showers by 2 minutes per person.</div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Run laundry and dishwashing with full loads.</div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Fix leaks: 1 dripping tap can waste 10-20 L/day.</div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">Use watering schedules for outdoor use.</div>
        </div>
      </Card>

      <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
        Estimate mode: calculated from selected inputs, baseline usage assumptions, and average local water-carbon factors.
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button as={Link} to="/register" size="lg">Create Account to Track Real Data</Button>
        <Button as={Link} to="/login" variant="ghost" size="lg">Login to Personal Meter</Button>
      </div>
    </Card>
  );
}

function Metric({ title, value, icon: Icon }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
        <Icon className="h-4 w-4 text-brand-700" />
      </div>
      <div className="mt-2 text-xl font-black text-slate-900">{value}</div>
    </Card>
  );
}

function MiniTrendChart({ title, subtitle, colorClass, points, accessor, unit }) {
  const width = 420;
  const height = 140;
  const padding = 18;

  if (!points.length) {
    return (
      <Card className="p-4">
        <div className="text-sm font-extrabold text-slate-900">{title}</div>
        <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
        <div className="mt-5 text-sm text-slate-500">No trend data yet.</div>
      </Card>
    );
  }

  const values = points.map((p) => Number(accessor(p) || 0));
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const coords = points.map((point, idx) => {
    const x = padding + (idx * (width - padding * 2)) / Math.max(points.length - 1, 1);
    const y = height - padding - ((Number(accessor(point) || 0) - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const path = coords.map((c, idx) => `${idx === 0 ? "M" : "L"}${c.x},${c.y}`).join(" ");
  const lastValue = Number(accessor(points[points.length - 1]) || 0);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-extrabold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
        </div>
        <div className="text-sm font-semibold text-slate-700">
          {lastValue.toLocaleString()} {unit}
        </div>
      </div>

      <div className="mt-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-32 w-full">
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />
          <path d={path} fill="none" strokeWidth="3" className={colorClass} strokeLinecap="round" />
          {coords.map((c, idx) => (
            <circle key={`${points[idx].date}-${idx}`} cx={c.x} cy={c.y} r="2.8" className={colorClass} />
          ))}
        </svg>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>{points[0].date}</span>
        <span>{points[points.length - 1].date}</span>
      </div>
    </Card>
  );
}

function PrivateMeter() {
  const { token } = useAuth();
  const [trendDays, setTrendDays] = useState(7);
  const [targetMode, setTargetMode] = useState("auto");
  const [customMonthlyTarget, setCustomMonthlyTarget] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [households, setHouseholds] = useState([]);
  const [recent, setRecent] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = monthStart.toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);

    try {
      const [statsRes, trendRes, householdsRes, recentRes] = await Promise.all([
        usageApi.carbonStats(token, { startDate, endDate }),
        usageApi.carbonTrend(token, { days: trendDays }),
        householdsApi.myHouseholds(token),
        usageApi.list(token, { page: 1, limit: 5, sort: "-occurredAt" }),
      ]);

      setStats(statsRes?.data || null);
      setTrend(buildWindowedTrend(trendRes?.data?.trend, trendDays));
      setHouseholds(Array.isArray(householdsRes) ? householdsRes : []);
      setRecent(Array.isArray(recentRes?.data) ? recentRes.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load virtual meter data");
      setStats(null);
      setTrend([]);
      setHouseholds([]);
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, [token, trendDays]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MONTHLY_TARGET_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.mode === "auto" || parsed?.mode === "custom") {
        setTargetMode(parsed.mode);
      }
      if (parsed?.value != null && Number(parsed.value) > 0) {
        setCustomMonthlyTarget(String(Math.round(Number(parsed.value))));
      }
    } catch {
      setTargetMode("auto");
      setCustomMonthlyTarget("");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      MONTHLY_TARGET_STORAGE_KEY,
      JSON.stringify({
        mode: targetMode,
        value: Number(customMonthlyTarget || 0),
      })
    );
  }, [targetMode, customMonthlyTarget]);

  const summary = useMemo(() => {
    const totalLiters = Number(stats?.current?.totalLiters || 0);
    const totalCarbon = Number(stats?.current?.totalCarbonKg || 0);
    const today = new Date().toISOString().slice(0, 10);
    const todayEntry = trend.find((t) => t.date === today);
    const todayLiters = Number(todayEntry?.totalLiters || 0);
    const baseTargetLiters = households.reduce((sum, h) => sum + Number(h.estimatedMonthlyLiters || 0), 0) || 1;
    const customTarget = Number(customMonthlyTarget || 0);
    const effectiveTargetLiters =
      targetMode === "custom" && customTarget > 0 ? customTarget : baseTargetLiters;
    const billForecast = households.reduce((sum, h) => sum + Number(h.predictedBill || 0), 0);
    const progress = Math.min((totalLiters / effectiveTargetLiters) * 100, 100);

    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const elapsedRatio = Math.max(dayOfMonth / daysInMonth, 0.01);
    const projectedMonthLiters = totalLiters / elapsedRatio;
    const projectedMonthCarbon = totalCarbon / elapsedRatio;
    const litersDeltaToTarget = projectedMonthLiters - effectiveTargetLiters;
    const budgetStatus = litersDeltaToTarget > 0 ? "Above target" : "Within target";

    return {
      totalLiters,
      totalCarbon,
      todayLiters,
      targetLiters: effectiveTargetLiters,
      baseTargetLiters,
      usingCustomTarget: targetMode === "custom" && customTarget > 0,
      billForecast,
      progress,
      projectedMonthLiters,
      projectedMonthCarbon,
      litersDeltaToTarget,
      budgetStatus,
    };
  }, [stats, trend, households, targetMode, customMonthlyTarget]);

  useEffect(() => {
    const weeklyLiters = Math.max(1, Math.round(summary.targetLiters / 4.345));
    try {
      const raw = localStorage.getItem(WEEKLY_GOALS_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const activities = Number(parsed?.activities || 20);
      localStorage.setItem(
        WEEKLY_GOALS_STORAGE_KEY,
        JSON.stringify({
          liters: weeklyLiters,
          activities,
        })
      );
    } catch {
      localStorage.setItem(
        WEEKLY_GOALS_STORAGE_KEY,
        JSON.stringify({
          liters: weeklyLiters,
          activities: 20,
        })
      );
    }
  }, [summary.targetLiters]);

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

  const diagnosticsText = useMemo(() => {
    const generatedAt = new Date().toLocaleString();
    const lines = [
      "Virtual Meter Diagnostics",
      `Generated at: ${generatedAt}`,
      `Window: ${trendDays} days`,
      "Formula: spike ratio = today liters / recent average liters",
      "Trigger: warning when ratio >= 1.30",
      `Today liters: ${Math.round(trendSummary.todayLiters)} L`,
      `Recent average: ${Math.round(trendSummary.recentAverageLiters)} L/day`,
      `Spike ratio: ${trendSummary.spikeRatio.toFixed(2)}`,
      `Status: ${trendSummary.hasSpike ? "Potential spike" : "Normal"}`,
      "Last 3 days liters:",
      ...trendSummary.lastThreeDays.map((d) => `- ${d.date}: ${d.liters.toLocaleString()} L`),
    ];
    return lines.join("\n");
  }, [trendDays, trendSummary]);

  const meterIntelligence = useMemo(() => {
    const variability = trendSummary.lastThreeDays.length > 1
      ? Math.max(...trendSummary.lastThreeDays.map((d) => d.liters)) - Math.min(...trendSummary.lastThreeDays.map((d) => d.liters))
      : 0;

    const riskScore = Math.min(
      100,
      Math.round((trendSummary.spikeRatio * 45) + (variability / 10))
    );

    const level = riskScore >= 70 ? "High" : riskScore >= 40 ? "Medium" : "Low";

    return { riskScore, level, variability };
  }, [trendSummary]);

  const optimizationPlan = useMemo(() => {
    const actions = [];

    if (summary.litersDeltaToTarget > 0) {
      actions.push("Reduce shower duration by 1-2 minutes for each resident.");
    }
    if (trendSummary.hasSpike) {
      actions.push("Inspect bathrooms and kitchen for continuous flow or hidden leaks.");
    }
    if (meterIntelligence.level !== "Low") {
      actions.push("Shift high-volume activities to planned windows and avoid overlap.");
    }
    if (actions.length === 0) {
      actions.push("Current usage is healthy. Keep your current conservation routine.");
    }

    const confidence = Math.max(55, Math.min(98, 98 - Math.round(meterIntelligence.variability / 8)));

    return { actions, confidence };
  }, [summary.litersDeltaToTarget, trendSummary.hasSpike, meterIntelligence]);

  async function copyDiagnostics() {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }
      await navigator.clipboard.writeText(diagnosticsText);
      setCopyStatus("Copied diagnostics.");
    } catch {
      setCopyStatus("Unable to copy diagnostics on this browser.");
    }
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Personal Virtual Meter</h2>
          <p className="mt-1 text-sm text-slate-600">Live from your usage records and household profiles.</p>
        </div>
        <Button variant="ghost" onClick={load}>Refresh</Button>
      </div>

      {error ? <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">{error}</div> : null}
      {loading ? <p className="mt-4 text-sm text-slate-500">Loading your meter...</p> : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Today usage" value={`${summary.todayLiters.toLocaleString()} L`} icon={Droplet} />
        <Metric title="This month usage" value={`${summary.totalLiters.toLocaleString()} L`} icon={Gauge} />
        <Metric title="This month carbon" value={`${summary.totalCarbon.toFixed(3)} kg`} icon={Leaf} />
        <Metric title="Bill forecast" value={summary.billForecast.toFixed(2)} icon={Receipt} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <TrendingUp className="h-4 w-4 text-brand-700" /> End-of-month projection
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">
            {Math.round(summary.projectedMonthLiters).toLocaleString()} L
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Projected carbon: {summary.projectedMonthCarbon.toFixed(3)} kg
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Target className="h-4 w-4 text-emerald-600" /> Budget status
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{summary.budgetStatus}</div>
          <div className="mt-1 text-xs text-slate-500">
            {summary.litersDeltaToTarget >= 0 ? "+" : ""}{Math.round(summary.litersDeltaToTarget).toLocaleString()} L vs target by month end.
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Meter intelligence
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{meterIntelligence.level} risk</div>
          <div className="mt-1 text-xs text-slate-500">
            Leak/spike risk score: {meterIntelligence.riskScore}/100 · Variability: {Math.round(meterIntelligence.variability)} L
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Zap className="h-4 w-4 text-violet-600" /> Recommended optimization plan
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {optimizationPlan.actions.map((action, idx) => (
              <div key={`${action}-${idx}`} className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                {idx + 1}. {action}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Projection confidence
          </div>
          <div className="mt-2 text-lg font-black text-slate-900">{optimizationPlan.confidence}%</div>
          <div className="mt-2 h-3 w-full rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500"
              style={{ width: `${optimizationPlan.confidence}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Confidence decreases when recent day-to-day variability is high.
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
          <div>
            <span className="font-semibold text-slate-700">Monthly goal progress</span>
            <div className="mt-1 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTargetMode("auto")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  targetMode === "auto"
                    ? "bg-brand-100 text-brand-900 ring-1 ring-brand-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Auto target
              </button>
              <button
                type="button"
                onClick={() => setTargetMode("custom")}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  targetMode === "custom"
                    ? "bg-brand-100 text-brand-900 ring-1 ring-brand-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Custom target
              </button>
            </div>
          </div>
          <span className="text-slate-600">{Math.round(summary.progress)}%</span>
        </div>

        {targetMode === "custom" ? (
          <div className="mt-3 max-w-xs">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom monthly liters target</label>
            <input
              type="number"
              min={1}
              value={customMonthlyTarget}
              onChange={(e) => setCustomMonthlyTarget(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              placeholder="Enter liters"
            />
          </div>
        ) : null}

        <div className="mt-2 h-3 w-full rounded-full bg-slate-100">
          <div className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width: `${summary.progress}%` }} />
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {summary.totalLiters.toLocaleString()} / {Math.round(summary.targetLiters).toLocaleString()} L
        </div>
        <div className="mt-1 text-xs text-slate-500">
          {summary.usingCustomTarget
            ? `Custom goal active. Auto recommendation is ${Math.round(summary.baseTargetLiters).toLocaleString()} L.`
            : "Auto goal from household profiles."}
        </div>
        <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100">
          Synced weekly target: ~{Math.max(1, Math.round(summary.targetLiters / 4.345)).toLocaleString()} L/week (used by Water Activities goals).
        </div>
        {stats?.comparison?.message ? (
          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 ring-1 ring-slate-100">
            {stats.comparison.message}
          </div>
        ) : null}
      </Card>

      {trendSummary.hasSpike ? (
        <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
          Potential usage spike: today is {Math.round((trendSummary.spikeRatio - 1) * 100)}% above your recent average ({Math.round(trendSummary.recentAverageLiters)} L/day). Check taps and toilets for leaks.
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
          Usage status normal: today is within your recent baseline ({Math.round(trendSummary.recentAverageLiters)} L/day).
        </div>
      )}

      <details className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-100">
        <summary className="cursor-pointer list-none font-semibold text-slate-800">
          Why this alert triggered
        </summary>
        <div className="mt-3 space-y-2 text-xs text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-slate-700">Diagnostics</p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="ghost" onClick={copyDiagnostics}>
                Copy diagnostics
              </Button>
              {copyStatus ? <span className="text-[11px] text-slate-500">{copyStatus}</span> : null}
            </div>
          </div>
          <p>
            Formula: spike ratio = today liters / recent average liters.
          </p>
          <p>
            Trigger rule: show warning when spike ratio >= 1.30.
          </p>
          <p>
            Current values: {Math.round(trendSummary.todayLiters)} L / {Math.round(trendSummary.recentAverageLiters)} L = {trendSummary.spikeRatio.toFixed(2)}.
          </p>
          <div>
            <div className="mb-1 font-semibold text-slate-700">Last 3 days liters</div>
            <div className="space-y-1">
              {trendSummary.lastThreeDays.length === 0 ? (
                <div>No daily usage records available.</div>
              ) : (
                trendSummary.lastThreeDays.map((d) => (
                  <div key={d.date} className="flex items-center justify-between rounded-md bg-white px-2 py-1 ring-1 ring-slate-100">
                    <span>{d.date}</span>
                    <span>{d.liters.toLocaleString()} L</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </details>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chart window</span>
        {[7, 14, 30].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setTrendDays(d)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${trendDays === d ? "bg-brand-100 text-brand-900 ring-1 ring-brand-200" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {d} days
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <MiniTrendChart
          title="Daily liters"
          subtitle={`Last ${trendDays} days`}
          colorClass="stroke-sky-600 fill-sky-600"
          points={trend}
          accessor={(p) => p.totalLiters}
          unit="L"
        />
        <MiniTrendChart
          title="Daily carbon"
          subtitle={`Last ${trendDays} days`}
          colorClass="stroke-emerald-600 fill-emerald-600"
          points={trend}
          accessor={(p) => p.totalCarbonKg}
          unit="kg"
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
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

        <Card className="p-4">
          <div className="text-sm font-extrabold text-slate-900">Quick actions</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button as={Link} to="/user/water-activities" className="gap-2" size="sm">
              <Activity className="h-4 w-4" /> Add activity
            </Button>
            <Button as={Link} to="/user/carbon-analytics" variant="ghost" size="sm" className="gap-2">
              <Target className="h-4 w-4" /> View analytics
            </Button>
          </div>
        </Card>
      </div>
    </Card>
  );
}

export function VirtualMeterPage() {
  const { token } = useAuth();

  return (
    <div className="bg-[radial-gradient(circle_at_10%_10%,rgba(14,165,233,0.08),transparent_30%),radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.08),transparent_35%)]">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-800">
            Advanced meter experience
          </div>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Virtual Water Meter</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Monitor usage in a realistic way: predictive estimation before login and intelligent live monitoring after login.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
            <span className={`rounded-full px-3 py-1 ${token ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
              Public estimator
            </span>
            <span className={`rounded-full px-3 py-1 ${token ? "bg-brand-100 text-brand-800" : "bg-slate-100 text-slate-600"}`}>
              Personal virtual meter
            </span>
          </div>
        </div>

        <div className="mt-8">
          {token ? <PrivateMeter /> : <PublicEstimator />}
        </div>
      </div>
      <Footer />
    </div>
  );
}
