import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usageApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { BrandLogo } from "../../components/BrandLogo";
import { Button } from "../../components/ui/Button";
import {
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Flame,
  BarChart3,
  CalendarDays,
  Lightbulb,
  Target,
  Download,
  Printer,
} from "lucide-react";

const ALLOWED_TREND_DAYS = new Set([7, 14, 30, 60, 90]);
const ALLOWED_LEADERBOARD_LIMITS = new Set([3, 5, 10]);
const MIN_FILTER_DATE = "2020-01-01";
const MAX_MONTHLY_GOAL_KG = 100000;

function formatDateInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function buildDailyTrendFromUsages(usages) {
  const grouped = usages.reduce((acc, item) => {
    const date = item?.occurredAt ? new Date(item.occurredAt).toISOString().slice(0, 10) : "";
    if (!date) return acc;
    acc[date] = (acc[date] || 0) + Number(item?.carbonFootprint?.carbonKg || 0);
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([date, totalCarbonKg]) => ({ date, totalCarbonKg: Number(totalCarbonKg.toFixed(3)) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function parseDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function validateFilters({ startDate, endDate, trendDays, leaderboardLimit, isAdmin }) {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const minDate = parseDateOnly(MIN_FILTER_DATE);
  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);

  if (startDate && !start) return "Start date is invalid.";
  if (endDate && !end) return "End date is invalid.";

  if (start && minDate && start < minDate) {
    return "Start date cannot be earlier than Jan 1, 2020.";
  }
  if (end && minDate && end < minDate) {
    return "End date cannot be earlier than Jan 1, 2020.";
  }

  if (start && start > today) return "Start date cannot be in the future.";
  if (end && end > today) return "End date cannot be in the future.";

  if (start && end && start > end) {
    return "Start date cannot be later than end date.";
  }

  if (!ALLOWED_TREND_DAYS.has(Number(trendDays))) {
    return "Trend window is invalid.";
  }

  if (isAdmin && !ALLOWED_LEADERBOARD_LIMITS.has(Number(leaderboardLimit))) {
    return "Leaderboard size is invalid.";
  }

  return "";
}

function sumCarbon(points = [], days = 7) {
  if (!Array.isArray(points) || points.length === 0) return 0;
  const sorted = [...points].sort((a, b) => new Date(a.date) - new Date(b.date));
  const slice = sorted.slice(-Math.max(days, 1));
  return slice.reduce((sum, item) => sum + Number(item?.totalCarbonKg || 0), 0);
}

function periodChangePercent(points = [], days = 7) {
  if (!Array.isArray(points) || points.length === 0) return 0;
  const sorted = [...points].sort((a, b) => new Date(a.date) - new Date(b.date));
  const current = sorted.slice(-Math.max(days, 1));
  const previous = sorted.slice(-Math.max(days * 2, 2), -Math.max(days, 1));

  const currentTotal = current.reduce((sum, item) => sum + Number(item?.totalCarbonKg || 0), 0);
  const previousTotal = previous.reduce((sum, item) => sum + Number(item?.totalCarbonKg || 0), 0);
  if (!previousTotal) return 0;
  return ((currentTotal - previousTotal) / previousTotal) * 100;
}

function KpiCard({ title, value, helper, accent = "brand", change = null, delay = 0 }) {
  const styles = {
    brand: "from-sky-50 to-cyan-50 ring-sky-100",
    emerald: "from-emerald-50 to-lime-50 ring-emerald-100",
    amber: "from-amber-50 to-orange-50 ring-amber-100",
    slate: "from-slate-50 to-zinc-50 ring-slate-200",
  };

  return (
    <Card
      className={`ca-pop ca-reveal-up bg-gradient-to-br p-5 ring-1 ${styles[accent] || styles.brand}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</div>
        {typeof change === "number" ? <ChangeBadge change={change} /> : null}
      </div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-600">{helper}</div> : null}
    </Card>
  );
}

function ChangeBadge({ change }) {
  const numeric = Number(change || 0);
  if (numeric > 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">
        <ArrowUpRight className="h-3.5 w-3.5" /> +{numeric.toFixed(1)}%
      </span>
    );
  }

  if (numeric < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
        <ArrowDownRight className="h-3.5 w-3.5" /> {numeric.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
      <Minus className="h-3.5 w-3.5" /> 0.0%
    </span>
  );
}

function TrendSparkline({ points }) {
  if (!Array.isArray(points) || points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        No trend data yet for this filter. Try expanding your date range or clearing activity drill-down.
      </div>
    );
  }

  const width = 640;
  const height = 180;
  const padding = 20;
  const values = points.map((p) => Number(p.totalCarbonKg || 0));
  const max = Math.max(...values, 1);

  const coordinates = points.map((p, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
    const y = height - padding - (Number(p.totalCarbonKg || 0) / max) * (height - padding * 2);
    return { x, y };
  });

  const path = coordinates.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaPath = `${path} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
        <defs>
          <linearGradient id="trendLineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" />

        <path d={areaPath} fill="url(#trendLineGradient)" opacity="0.15" />
        <path d={path} fill="none" stroke="url(#trendLineGradient)" strokeWidth="3" strokeLinecap="round" />

        {coordinates.map((c, i) => (
          <circle key={`${points[i].date}-${i}`} cx={c.x} cy={c.y} r="3" fill="#0369a1" />
        ))}
      </svg>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{points[0]?.date || ""}</span>
        <span>{points[points.length - 1]?.date || ""}</span>
      </div>
    </div>
  );
}

function ActivityBars({ items, selectedActivity, onSelectActivity, onClearSelection }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
        No activity breakdown found for this range. Apply a wider date window to compare categories.
      </div>
    );
  }

  const max = Math.max(...items.map((i) => Number(i.totalCarbonKg || 0)), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = Number(item.totalCarbonKg || 0);
        const width = `${Math.max((value / max) * 100, 2)}%`;
        return (
          <button
            key={item.activityType}
            type="button"
            onClick={() => onSelectActivity(item.activityType)}
            className={`w-full rounded-lg p-1 text-left transition ${
              selectedActivity === item.activityType ? "bg-brand-50 ring-1 ring-brand-100" : "hover:bg-slate-50"
            }`}
          >
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800">{item.activityType}</span>
              <span className="text-slate-600">{value.toFixed(3)} kg</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width }} />
            </div>
          </button>
        );
      })}
      {selectedActivity ? (
        <Button type="button" size="sm" variant="ghost" onClick={onClearSelection}>
          Clear activity filter
        </Button>
      ) : null}
    </div>
  );
}

export function CarbonAnalytics() {
  const { token, user } = useAuth();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [trendDays, setTrendDays] = useState(30);
  const [leaderboardLimit, setLeaderboardLimit] = useState(5);
  const [selectedActivity, setSelectedActivity] = useState("");
  const [monthlyGoalKg, setMonthlyGoalKg] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("carbon.monthlyGoalKg") || "";
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [goalError, setGoalError] = useState("");

  const [statsData, setStatsData] = useState(null);
  const [breakdownData, setBreakdownData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [activityUsages, setActivityUsages] = useState([]);

  const load = useCallback(async () => {
    const filterError = validateFilters({ startDate, endDate, trendDays, leaderboardLimit, isAdmin });
    if (filterError) {
      setError(filterError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const [statsRes, breakdownRes, trendRes, leaderboardRes] = await Promise.all([
        usageApi.carbonStats(token, { startDate, endDate }),
        usageApi.carbonByActivity(token, { startDate, endDate }),
        usageApi.carbonTrend(token, { days: trendDays }),
        isAdmin
          ? usageApi.carbonLeaderboard(token, { startDate, endDate, limit: leaderboardLimit })
          : Promise.resolve({ data: { leaderboard: [] } }),
      ]);

      setStatsData(statsRes?.data || null);
      setBreakdownData(Array.isArray(breakdownRes?.data?.breakdown) ? breakdownRes.data.breakdown : []);
      setTrendData(Array.isArray(trendRes?.data?.trend) ? trendRes.data.trend : []);
      setLeaderboardData(Array.isArray(leaderboardRes?.data?.leaderboard) ? leaderboardRes.data.leaderboard : []);

      if (selectedActivity) {
        const activityUsagesRes = await usageApi.list(token, {
          page: 1,
          limit: 1000,
          activityType: selectedActivity,
          startDate,
          endDate,
          sort: "occurredAt",
        });
        setActivityUsages(Array.isArray(activityUsagesRes?.data) ? activityUsagesRes.data : []);
      } else {
        setActivityUsages([]);
      }
    } catch (e) {
      setError(e?.message || "Failed to load carbon analytics");
      setStatsData(null);
      setBreakdownData([]);
      setTrendData([]);
      setLeaderboardData([]);
      setActivityUsages([]);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate, trendDays, leaderboardLimit, selectedActivity, isAdmin]);

  useEffect(() => {
    if (!selectedActivity) return;
    const exists = breakdownData.some((item) => item.activityType === selectedActivity);
    if (!exists) setSelectedActivity("");
  }, [selectedActivity, breakdownData]);

  const selectedActivityTrendData = useMemo(
    () => buildDailyTrendFromUsages(activityUsages),
    [activityUsages]
  );

  const selectedActivityStats = useMemo(() => {
    if (!selectedActivity) return null;
    return {
      carbonKg: activityUsages.reduce((sum, item) => sum + Number(item?.carbonFootprint?.carbonKg || 0), 0),
      liters: activityUsages.reduce((sum, item) => sum + Number(item?.liters || 0), 0),
    };
  }, [selectedActivity, activityUsages]);

  const displayedTrendData = selectedActivity ? selectedActivityTrendData : trendData;

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const current = statsData?.current || {};
    const comparison = statsData?.comparison || {};
    const topActivity = breakdownData[0] || null;
    const scopedLiters = selectedActivity
      ? Number(selectedActivityStats?.liters || 0)
      : Number(current.totalLiters || 0);
    const scopedCarbon = selectedActivity
      ? Number(selectedActivityStats?.carbonKg || 0)
      : Number(current.totalCarbonKg || 0);

    const carbonPerLiterGrams = scopedLiters ? (scopedCarbon * 1000) / scopedLiters : 0;

    const sortedTrend = [...displayedTrendData].sort((a, b) => Number(a.totalCarbonKg || 0) - Number(b.totalCarbonKg || 0));
    const minPoint = sortedTrend[0] || null;
    const maxPoint = sortedTrend[sortedTrend.length - 1] || null;

    return {
      carbonKg: selectedActivity
        ? Number(selectedActivityStats?.carbonKg || 0)
        : Number(current.totalCarbonKg || 0),
      liters: selectedActivity
        ? Number(selectedActivityStats?.liters || 0)
        : Number(current.totalLiters || 0),
      heatedPct: Number(current.heatedWaterPercentage || 0),
      dailyAvg: displayedTrendData.length
        ? displayedTrendData.reduce((sum, d) => sum + Number(d.totalCarbonKg || 0), 0) / displayedTrendData.length
        : 0,
      trend: comparison.trend || "stable",
      trendMessage: comparison.message || "No comparison available",
      change: Number(comparison.carbonChange || 0),
      topActivity: selectedActivity
        ? { activityType: selectedActivity, totalCarbonKg: Number(selectedActivityStats?.carbonKg || 0) }
        : topActivity,
      carbonPerLiterGrams,
      minPoint,
      maxPoint,
    };
  }, [
    statsData,
    breakdownData,
    selectedActivity,
    selectedActivityStats,
    displayedTrendData,
  ]);

  const periodSummary = useMemo(() => {
    const last7 = sumCarbon(displayedTrendData, 7);
    const last30 = sumCarbon(displayedTrendData, 30);
    const change7 = periodChangePercent(displayedTrendData, 7);
    return { last7, last30, change7 };
  }, [displayedTrendData]);

  const activityBreakdown = useMemo(() => {
    const total = breakdownData.reduce((sum, item) => sum + Number(item?.totalCarbonKg || 0), 0);
    return breakdownData.slice(0, 4).map((item) => {
      const value = Number(item?.totalCarbonKg || 0);
      return {
        ...item,
        totalCarbonKg: value,
        percent: total ? (value / total) * 100 : 0,
      };
    });
  }, [breakdownData]);

  const goalProgress = useMemo(() => {
    const parsedGoal = Number(monthlyGoalKg);
    const goal = Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : 0;
    const current = Number(periodSummary.last30 || 0);
    if (!goal) {
      const suggested = periodSummary.last30 > 0 ? periodSummary.last30 * 0.9 : 10;
      return {
        hasGoal: false,
        goal: Number(suggested.toFixed(2)),
        current,
        pct: 0,
        remaining: Number(suggested.toFixed(2)),
        onTrack: true,
      };
    }

    const pct = Math.min((current / goal) * 100, 100);
    const remaining = Math.max(goal - current, 0);
    return {
      hasGoal: true,
      goal,
      current,
      pct,
      remaining,
      onTrack: current <= goal,
    };
  }, [monthlyGoalKg, periodSummary.last30]);

  const insightRecommendation = useMemo(() => {
    if (summary.heatedPct >= 60) {
      return "High heated-water impact detected. Try shorter hot water sessions to reduce carbon quickly.";
    }
    if (summary.topActivity?.activityType) {
      return `Focus on ${summary.topActivity.activityType.toLowerCase()} optimization this week for the biggest gains.`;
    }
    return "Maintain consistency this week and monitor daily spikes to keep emissions stable.";
  }, [summary.heatedPct, summary.topActivity]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!monthlyGoalKg) {
      window.localStorage.removeItem("carbon.monthlyGoalKg");
      setGoalError("");
      return;
    }

    const parsed = Number(monthlyGoalKg);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setGoalError("Goal must be a number greater than 0.");
      return;
    }
    if (parsed > MAX_MONTHLY_GOAL_KG) {
      setGoalError(`Goal cannot exceed ${MAX_MONTHLY_GOAL_KG} kg.`);
      return;
    }

    setGoalError("");
    window.localStorage.setItem("carbon.monthlyGoalKg", String(monthlyGoalKg));
  }, [monthlyGoalKg]);

  function applyDatePreset(preset) {
    const today = new Date();
    const end = formatDateInput(today);

    if (preset === "today") {
      setStartDate(end);
      setEndDate(end);
      return;
    }

    if (preset === "7d") {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      setStartDate(formatDateInput(start));
      setEndDate(end);
      setTrendDays(7);
      return;
    }

    if (preset === "30d") {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      setStartDate(formatDateInput(start));
      setEndDate(end);
      setTrendDays(30);
      return;
    }

    if (preset === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDateInput(start));
      setEndDate(end);
    }
  }

  function clearFilters() {
    setStartDate("");
    setEndDate("");
    setTrendDays(30);
    setLeaderboardLimit(5);
    setError("");
  }

  function handleGoalChange(rawValue) {
    // Allow empty value and decimal numeric typing flow.
    if (rawValue === "") {
      setMonthlyGoalKg("");
      return;
    }
    if (!/^\d*\.?\d*$/.test(rawValue)) return;
    setMonthlyGoalKg(rawValue);
  }

  function downloadCsv(filename, rows) {
    const csvContent = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportCarbonReport() {
    const today = new Date().toISOString().slice(0, 10);
    const trendRows = displayedTrendData.map((point) => [point.date, Number(point.totalCarbonKg || 0).toFixed(3)]);
    const activityRows = breakdownData.map((item) => [item.activityType, Number(item.totalCarbonKg || 0).toFixed(3)]);

    const rows = [
      ["Metric", "Value"],
      ["Total Carbon (kg)", summary.carbonKg.toFixed(3)],
      ["Total Liters", Number(summary.liters || 0).toFixed(0)],
      ["Carbon Intensity (g/L)", summary.carbonPerLiterGrams.toFixed(2)],
      ["Daily Avg Carbon (kg)", summary.dailyAvg.toFixed(3)],
      [],
      ["Trend Date", "Carbon (kg)"],
      ...trendRows,
      [],
      ["Activity", "Carbon (kg)"],
      ...activityRows,
    ];

    downloadCsv(`carbon-analytics-${today}.csv`, rows);
  }

  function printReport() {
    if (typeof window === "undefined") return;
    window.print();
  }

  const hasAnyData = displayedTrendData.length > 0 || breakdownData.length > 0 || Number(summary.carbonKg || 0) > 0;
  const reveal = (delay) => ({ animationDelay: `${delay}ms` });
  const todayInput = formatDateInput(new Date());

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Carbon analytics</h1>
          <p className="mt-1 text-sm text-slate-600">
            Understand your water usage footprint with trend, activity, and comparison metrics.
          </p>
          {selectedActivity ? (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
              Drill-down active: {selectedActivity}
              <button
                type="button"
                onClick={() => setSelectedActivity("")}
                className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-brand-700 hover:bg-white"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="ghost" className="gap-2" onClick={exportCarbonReport} disabled={!hasAnyData}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button type="button" variant="ghost" className="gap-2" onClick={printReport}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button type="button" variant="ghost" className="gap-2" onClick={load} disabled={Boolean(goalError)}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <Card className="ca-reveal-up mt-6 border border-slate-200/80 bg-white/95 p-5 shadow-sm backdrop-blur" style={reveal(40)}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Quick windows</div>
          <Button type="button" size="sm" variant={trendDays === 7 ? "primary" : "ghost"} onClick={() => setTrendDays(7)}>7d</Button>
          <Button type="button" size="sm" variant={trendDays === 30 ? "primary" : "ghost"} onClick={() => setTrendDays(30)}>30d</Button>
          <Button type="button" size="sm" variant={trendDays === 90 ? "primary" : "ghost"} onClick={() => setTrendDays(90)}>90d</Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={MIN_FILTER_DATE}
              max={todayInput}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={MIN_FILTER_DATE}
              max={todayInput}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trend window (days)</label>
            <select
              value={trendDays}
              onChange={(e) => setTrendDays(Number(e.target.value))}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          {isAdmin ? (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Leaderboard size</label>
              <select
                value={leaderboardLimit}
                onChange={(e) => setLeaderboardLimit(Number(e.target.value))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value={3}>Top 3</option>
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
              </select>
            </div>
          ) : null}
          <div className="flex items-end">
            <Button type="button" className="w-full" onClick={load} disabled={Boolean(goalError)}>
              Apply filters
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => applyDatePreset("today")}>Today</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => applyDatePreset("7d")}>Last 7 days</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => applyDatePreset("30d")}>Last 30 days</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => applyDatePreset("month")}>This month</Button>
          <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>Reset</Button>
        </div>
      </Card>

      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <Card key={`sk-kpi-${n}`} className="animate-pulse p-5">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-8 w-28 rounded bg-slate-200" />
                <div className="mt-2 h-3 w-32 rounded bg-slate-100" />
              </Card>
            ))}
          </div>
          <Card className="animate-pulse p-6">
            <div className="h-4 w-40 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-56 rounded bg-slate-100" />
            <div className="mt-4 h-48 w-full rounded bg-slate-100" />
          </Card>
          <div className="grid gap-4 xl:grid-cols-2">
            {[1, 2].map((n) => (
              <Card key={`sk-panel-${n}`} className="animate-pulse p-6">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="mt-3 h-3 w-56 rounded bg-slate-100" />
                <div className="mt-4 h-20 w-full rounded bg-slate-100" />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Total CO2"
          value={`${summary.carbonKg.toFixed(3)} kg`}
          helper={selectedActivity ? `Filtered by ${selectedActivity}` : "Selected period"}
          accent="brand"
          change={selectedActivity ? null : summary.change}
          delay={80}
        />
        <KpiCard
          title="Last 7 Days"
          value={`${periodSummary.last7.toFixed(3)} kg`}
          helper="Recent footprint"
          accent="emerald"
          change={periodSummary.change7}
          delay={130}
        />
        <KpiCard
          title="Last 30 Days"
          value={`${periodSummary.last30.toFixed(3)} kg`}
          helper="Rolling total"
          accent="amber"
          delay={180}
        />
        <KpiCard
          title="Carbon Intensity"
          value={`${summary.carbonPerLiterGrams.toFixed(2)} g/L`}
          helper={`Daily avg ${summary.dailyAvg.toFixed(3)} kg`}
          accent="slate"
          delay={230}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="ca-pop ca-reveal-up p-5" style={reveal(260)}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Flame className="h-4 w-4 text-orange-500" /> Heated impact estimate
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {((summary.carbonKg * summary.heatedPct) / 100).toFixed(3)} kg
          </div>
          <div className="mt-1 text-xs text-slate-500">Approximate carbon linked to heated water usage.</div>
        </Card>

        <Card className="ca-pop ca-reveal-up p-5" style={reveal(300)}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <BrandLogo className="h-4 w-4" alt="" /> Carbon intensity
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{summary.carbonPerLiterGrams.toFixed(2)} g/L</div>
          <div className="mt-1 text-xs text-slate-500">Grams of carbon per liter in the selected period.</div>
        </Card>

        <Card className="ca-pop ca-reveal-up p-5" style={reveal(340)}>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <BarChart3 className="h-4 w-4 text-emerald-500" /> Top contributor
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{summary.topActivity?.activityType || "N/A"}</div>
          <div className="mt-1 text-xs text-slate-500">
            {summary.topActivity ? `${Number(summary.topActivity.totalCarbonKg || 0).toFixed(3)} kg` : "No activity data"}
          </div>
        </Card>
      </div>

      <Card className="ca-pop ca-reveal-up mt-6 border border-slate-200 p-6" style={reveal(380)}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Carbon trend</h2>
            <p className="mt-1 text-sm text-slate-600">
              Daily CO2 footprint based on usage records {selectedActivity ? `for ${selectedActivity}` : "for all activities"}.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-sky-500" /> Trend line
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Lowest period
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Highest period
            </span>
          </div>
        </div>
        <div className="mt-4">
          <TrendSparkline points={displayedTrendData} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Lowest day</div>
            <div className="mt-1 text-sm font-semibold text-emerald-900">
              {summary.minPoint ? `${summary.minPoint.date} - ${Number(summary.minPoint.totalCarbonKg || 0).toFixed(3)} kg` : "No data"}
            </div>
          </div>
          <div className="rounded-xl bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">Highest day</div>
            <div className="mt-1 text-sm font-semibold text-rose-900">
              {summary.maxPoint ? `${summary.maxPoint.date} - ${Number(summary.maxPoint.totalCarbonKg || 0).toFixed(3)} kg` : "No data"}
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{summary.trendMessage}</div>
      </Card>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card className="ca-pop ca-reveal-up p-6" style={reveal(420)}>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-extrabold text-slate-900">Key insights</h2>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-100">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Best saving day</div>
              <div className="mt-1 text-sm font-semibold text-emerald-900">
                {summary.minPoint
                  ? `${summary.minPoint.date} at ${Number(summary.minPoint.totalCarbonKg || 0).toFixed(3)} kg`
                  : "Not enough trend data yet"}
              </div>
            </div>
            <div className="rounded-xl bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
              <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">Highest impact day</div>
              <div className="mt-1 text-sm font-semibold text-rose-900">
                {summary.maxPoint
                  ? `${summary.maxPoint.date} at ${Number(summary.maxPoint.totalCarbonKg || 0).toFixed(3)} kg`
                  : "Not enough trend data yet"}
              </div>
            </div>
            <div className="rounded-xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Suggested action</div>
              <div className="mt-1 text-sm text-sky-900">{insightRecommendation}</div>
            </div>
          </div>
        </Card>

        <Card className="ca-pop ca-reveal-up p-6" style={reveal(460)}>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-cyan-600" />
            <h2 className="text-lg font-extrabold text-slate-900">Monthly goal progress</h2>
          </div>
          <p className="mt-1 text-sm text-slate-600">Track your rolling 30-day footprint against a personal target.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Goal (kg CO2)</label>
              <input
                type="number"
                min="0.1"
                max={MAX_MONTHLY_GOAL_KG}
                step="0.1"
                value={monthlyGoalKg}
                onChange={(e) => handleGoalChange(e.target.value)}
                placeholder={goalProgress.goal.toFixed(1)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              {goalError ? <div className="mt-1 text-xs font-semibold text-rose-700">{goalError}</div> : null}
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
              <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                <CalendarDays className="h-3.5 w-3.5" /> Rolling 30-day total
              </div>
              <div className="mt-1 text-lg font-black text-slate-900">{goalProgress.current.toFixed(3)} kg</div>
            </div>
          </div>

          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-3 rounded-full transition-all ${goalProgress.onTrack ? "bg-emerald-500" : "bg-rose-500"}`}
              style={{ width: `${Math.max(Math.min(goalProgress.pct, 100), 4)}%` }}
            />
          </div>

          <div className="mt-2 text-sm text-slate-600">
            {goalProgress.hasGoal
              ? goalProgress.onTrack
                ? `${goalProgress.remaining.toFixed(2)} kg remaining to stay within target.`
                : `Above target by ${(goalProgress.current - goalProgress.goal).toFixed(2)} kg.`
              : `Set a goal to begin tracking progress. Suggested target: ${goalProgress.goal.toFixed(1)} kg.`}
          </div>
        </Card>
      </div>

      <div className={`mt-6 grid gap-4 ${isAdmin ? "xl:grid-cols-2" : "xl:grid-cols-1"}`}>
        <Card className="ca-pop ca-reveal-up p-6" style={reveal(500)}>
          <h2 className="text-lg font-extrabold text-slate-900">By activity</h2>
          <p className="mt-1 text-sm text-slate-600">Click an activity to drill into focused analytics.</p>
          {activityBreakdown.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {activityBreakdown.map((item) => (
                <div key={`chip-${item.activityType}`} className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                    <span>{item.activityType}</span>
                    <span>{item.percent.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 text-sm font-bold text-slate-900">{item.totalCarbonKg.toFixed(3)} kg</div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="mt-4">
            <ActivityBars
              items={breakdownData}
              selectedActivity={selectedActivity}
              onSelectActivity={setSelectedActivity}
              onClearSelection={() => setSelectedActivity("")}
            />
          </div>
        </Card>

        {isAdmin ? (
          <Card className="ca-pop ca-reveal-up p-6" style={reveal(540)}>
            <h2 className="text-lg font-extrabold text-slate-900">Leaderboard</h2>
            <p className="mt-1 text-sm text-slate-600">Best households by low carbon output.</p>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Rank</th>
                    <th className="px-3 py-2">Household</th>
                    <th className="px-3 py-2">Carbon (kg)</th>
                    <th className="px-3 py-2">Per resident</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {leaderboardData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                        No leaderboard data for current filters.
                      </td>
                    </tr>
                  ) : (
                    leaderboardData.map((row) => (
                      <tr key={row.householdId}>
                        <td className="px-3 py-2">{row.rank}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">{row.householdName}</td>
                        <td className="px-3 py-2">{Number(row.totalCarbonKg || 0).toFixed(3)}</td>
                        <td className="px-3 py-2">{Number(row.carbonPerResident || 0).toFixed(3)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        ) : null}
      </div>
        </>
      )}
    </div>
  );
}
