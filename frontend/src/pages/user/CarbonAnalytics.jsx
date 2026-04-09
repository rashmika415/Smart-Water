import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usageApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { RefreshCw, ArrowUpRight, ArrowDownRight, Minus, Flame, Droplets, BarChart3 } from "lucide-react";

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

function StatCard({ title, value, helper }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
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
    return <div className="text-sm text-slate-500">No trend data yet.</div>;
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
    return <div className="text-sm text-slate-500">No activity breakdown found.</div>;
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
  const { token } = useAuth();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [trendDays, setTrendDays] = useState(30);
  const [leaderboardLimit, setLeaderboardLimit] = useState(5);
  const [selectedActivity, setSelectedActivity] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statsData, setStatsData] = useState(null);
  const [breakdownData, setBreakdownData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [activityUsages, setActivityUsages] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, breakdownRes, trendRes, leaderboardRes] = await Promise.all([
        usageApi.carbonStats(token, { startDate, endDate }),
        usageApi.carbonByActivity(token, { startDate, endDate }),
        usageApi.carbonTrend(token, { days: trendDays }),
        usageApi.carbonLeaderboard(token, { startDate, endDate, limit: leaderboardLimit }),
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
  }, [token, startDate, endDate, trendDays, leaderboardLimit, selectedActivity]);

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
  }

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
        <Button type="button" variant="ghost" className="gap-2" onClick={load}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <Card className="mt-6 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
          <div className="flex items-end">
            <Button type="button" className="w-full" onClick={load}>
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

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading carbon analytics...</p> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total carbon</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summary.carbonKg.toFixed(3)} kg</div>
          <div className="mt-2 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {selectedActivity ? `Filtered by ${selectedActivity}` : "vs previous period"}
            </div>
            {selectedActivity ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-700">
                Activity scope
              </span>
            ) : (
              <ChangeBadge change={summary.change} />
            )}
          </div>
        </Card>
        <StatCard title="Total liters" value={summary.liters.toLocaleString()} helper="Selected period" />
        <StatCard title="Heated water" value={`${summary.heatedPct.toFixed(1)}%`} helper="Of total usage" />
        <StatCard title="Daily avg carbon" value={`${summary.dailyAvg.toFixed(3)} kg`} helper={`Trend: ${summary.trend}`} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Flame className="h-4 w-4 text-orange-500" /> Heated impact estimate
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">
            {((summary.carbonKg * summary.heatedPct) / 100).toFixed(3)} kg
          </div>
          <div className="mt-1 text-xs text-slate-500">Approximate carbon linked to heated water usage.</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Droplets className="h-4 w-4 text-sky-500" /> Carbon intensity
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{summary.carbonPerLiterGrams.toFixed(2)} g/L</div>
          <div className="mt-1 text-xs text-slate-500">Grams of carbon per liter in the selected period.</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <BarChart3 className="h-4 w-4 text-emerald-500" /> Top contributor
          </div>
          <div className="mt-2 text-xl font-black text-slate-900">{summary.topActivity?.activityType || "N/A"}</div>
          <div className="mt-1 text-xs text-slate-500">
            {summary.topActivity ? `${Number(summary.topActivity.totalCarbonKg || 0).toFixed(3)} kg` : "No activity data"}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Carbon trend</h2>
        <p className="mt-1 text-sm text-slate-600">
          Daily CO2 footprint based on usage records {selectedActivity ? `for ${selectedActivity}` : "for all activities"}.
        </p>
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
        <Card className="p-6">
          <h2 className="text-lg font-extrabold text-slate-900">By activity</h2>
          <p className="mt-1 text-sm text-slate-600">Click an activity to drill into focused analytics.</p>
          <div className="mt-4">
            <ActivityBars
              items={breakdownData}
              selectedActivity={selectedActivity}
              onSelectActivity={setSelectedActivity}
              onClearSelection={() => setSelectedActivity("")}
            />
          </div>
        </Card>

        <Card className="p-6">
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
                    <td colSpan={4} className="px-3 py-6 text-center text-slate-500">No leaderboard data.</td>
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
      </div>
    </div>
  );
}
