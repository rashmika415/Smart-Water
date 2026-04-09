import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usageApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { RefreshCw } from "lucide-react";

function StatCard({ title, value, helper }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
    </Card>
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

function ActivityBars({ items }) {
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
          <div key={item.activityType}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-800">{item.activityType}</span>
              <span className="text-slate-600">{value.toFixed(3)} kg</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" style={{ width }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CarbonAnalytics() {
  const { token } = useAuth();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [trendDays, setTrendDays] = useState(30);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statsData, setStatsData] = useState(null);
  const [breakdownData, setBreakdownData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, breakdownRes, trendRes, leaderboardRes] = await Promise.all([
        usageApi.carbonStats(token, { startDate, endDate }),
        usageApi.carbonByActivity(token, { startDate, endDate }),
        usageApi.carbonTrend(token, { days: trendDays }),
        usageApi.carbonLeaderboard(token, { startDate, endDate, limit: 5 }),
      ]);

      setStatsData(statsRes?.data || null);
      setBreakdownData(Array.isArray(breakdownRes?.data?.breakdown) ? breakdownRes.data.breakdown : []);
      setTrendData(Array.isArray(trendRes?.data?.trend) ? trendRes.data.trend : []);
      setLeaderboardData(Array.isArray(leaderboardRes?.data?.leaderboard) ? leaderboardRes.data.leaderboard : []);
    } catch (e) {
      setError(e?.message || "Failed to load carbon analytics");
      setStatsData(null);
      setBreakdownData([]);
      setTrendData([]);
      setLeaderboardData([]);
    } finally {
      setLoading(false);
    }
  }, [token, startDate, endDate, trendDays]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const current = statsData?.current || {};
    const comparison = statsData?.comparison || {};
    return {
      carbonKg: Number(current.totalCarbonKg || 0),
      liters: Number(current.totalLiters || 0),
      heatedPct: Number(current.heatedWaterPercentage || 0),
      dailyAvg: trendData.length
        ? trendData.reduce((sum, d) => sum + Number(d.totalCarbonKg || 0), 0) / trendData.length
        : 0,
      trend: comparison.trend || "stable",
      trendMessage: comparison.message || "No comparison available",
      change: Number(comparison.carbonChange || 0),
    };
  }, [statsData, trendData]);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Carbon analytics</h1>
          <p className="mt-1 text-sm text-slate-600">
            Understand your water usage footprint with trend, activity, and comparison metrics.
          </p>
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
          <div className="flex items-end">
            <Button type="button" className="w-full" onClick={load}>
              Apply filters
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading carbon analytics...</p> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total carbon" value={`${summary.carbonKg.toFixed(3)} kg`} helper={`Change: ${summary.change.toFixed(1)}%`} />
        <StatCard title="Total liters" value={summary.liters.toLocaleString()} helper="Selected period" />
        <StatCard title="Heated water" value={`${summary.heatedPct.toFixed(1)}%`} helper="Of total usage" />
        <StatCard title="Daily avg carbon" value={`${summary.dailyAvg.toFixed(3)} kg`} helper={`Trend: ${summary.trend}`} />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Carbon trend</h2>
        <p className="mt-1 text-sm text-slate-600">Daily CO2 footprint based on usage records.</p>
        <div className="mt-4">
          <TrendSparkline points={trendData} />
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{summary.trendMessage}</div>
      </Card>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-extrabold text-slate-900">By activity</h2>
          <p className="mt-1 text-sm text-slate-600">Top carbon contributors by activity type.</p>
          <div className="mt-4">
            <ActivityBars items={breakdownData} />
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
