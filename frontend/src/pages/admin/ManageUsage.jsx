import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usageApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Search, Eye, ChevronLeft, ChevronRight, Droplets, Leaf, Home, Activity } from "lucide-react";

function MetricCard({ label, value, icon: Icon, tone = "bg-sky-50 text-sky-700" }) {
  return (
    <Card className="border border-slate-200/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</div>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function HouseholdDetailsModal({ open, data, loading, error, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <div className="text-lg font-extrabold text-slate-900">Household usage details</div>
            <div className="text-xs text-slate-500">Detailed records for selected household</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-4">
          {loading ? (
            <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-600">Loading details...</div>
          ) : error ? (
            <div className="rounded-xl bg-rose-50 px-4 py-6 text-sm text-rose-700">{error}</div>
          ) : !data ? (
            <div className="rounded-xl bg-slate-50 px-4 py-6 text-sm text-slate-600">No detail data found.</div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <Card className="border border-slate-200/80 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Household</div>
                  <div className="mt-2 text-lg font-extrabold text-slate-900">{data.household?.name || "-"}</div>
                </Card>
                <Card className="border border-slate-200/80 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total liters</div>
                  <div className="mt-2 text-lg font-extrabold text-slate-900">
                    {Number(data.summary?.totalLiters || 0).toLocaleString()} L
                  </div>
                </Card>
                <Card className="border border-slate-200/80 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Carbon</div>
                  <div className="mt-2 text-lg font-extrabold text-slate-900">
                    {Number(data.summary?.totalCarbonKg || 0).toFixed(3)} kg
                  </div>
                </Card>
                <Card className="border border-slate-200/80 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Records</div>
                  <div className="mt-2 text-lg font-extrabold text-slate-900">
                    {Number(data.summary?.usageCount || 0).toLocaleString()}
                  </div>
                </Card>
              </div>

              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Activity</th>
                        <th className="px-4 py-3">Liters</th>
                        <th className="px-4 py-3">Carbon (kg)</th>
                        <th className="px-4 py-3">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {(data.records || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            No records in selected period.
                          </td>
                        </tr>
                      ) : (
                        (data.records || []).map((record) => (
                          <tr key={record._id} className="hover:bg-slate-50/80">
                            <td className="px-4 py-3 text-slate-600">
                              {record.occurredAt ? new Date(record.occurredAt).toLocaleString() : "-"}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">{record.activityType || "-"}</td>
                            <td className="px-4 py-3">{Math.round(Number(record.liters || 0))}</td>
                            <td className="px-4 py-3">
                              {Number(record?.carbonFootprint?.carbonKg || 0).toFixed(3)}
                            </td>
                            <td className="px-4 py-3 capitalize text-slate-600">{record.source || "manual"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ManageUsage() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("-totalLiters");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [overview, setOverview] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [rowsData, setRowsData] = useState({ rows: [], total: 0, totalPages: 1, page: 1 });

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingAnomalies, setLoadingAnomalies] = useState(true);
  const [loadingRows, setLoadingRows] = useState(true);
  const [errorOverview, setErrorOverview] = useState("");
  const [errorAnomalies, setErrorAnomalies] = useState("");
  const [errorRows, setErrorRows] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, days, sort]);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    setErrorOverview("");
    try {
      const res = await usageApi.adminOverview(token, { days });
      setOverview(res?.data || null);
    } catch (err) {
      setErrorOverview(err?.message || "Failed to load usage overview");
    } finally {
      setLoadingOverview(false);
    }
  }, [token, days]);

  const loadHouseholds = useCallback(async () => {
    setLoadingRows(true);
    setErrorRows("");
    try {
      const res = await usageApi.adminHouseholds(token, {
        page,
        limit,
        search: debouncedSearch,
        days,
        sort,
      });
      setRowsData({
        rows: Array.isArray(res?.data?.rows) ? res.data.rows : [],
        total: Number(res?.data?.total || 0),
        totalPages: Number(res?.data?.totalPages || 1),
        page: Number(res?.data?.page || 1),
      });
    } catch (err) {
      setErrorRows(err?.message || "Failed to load household usage analytics");
    } finally {
      setLoadingRows(false);
    }
  }, [token, page, limit, debouncedSearch, days, sort]);

  const loadAnomalies = useCallback(async () => {
    setLoadingAnomalies(true);
    setErrorAnomalies("");
    try {
      const res = await usageApi.adminAnomalies(token, { days });
      setAnomalies(res?.data || null);
    } catch (err) {
      setErrorAnomalies(err?.message || "Failed to load anomaly insights");
    } finally {
      setLoadingAnomalies(false);
    }
  }, [token, days]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadHouseholds();
  }, [loadHouseholds]);

  useEffect(() => {
    loadAnomalies();
  }, [loadAnomalies]);

  const openDetails = useCallback(
    async (householdId) => {
      if (!householdId) return;
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailError("");
      setDetailData(null);
      try {
        const res = await usageApi.adminHouseholdDetails(token, householdId, {
          page: 1,
          limit: 50,
          days,
          sort: "-occurredAt",
        });
        setDetailData(res?.data || null);
      } catch (err) {
        setDetailError(err?.message || "Failed to load household details");
      } finally {
        setDetailLoading(false);
      }
    },
    [token, days]
  );

  const activitySummary = useMemo(() => {
    if (!overview?.topActivities?.length) return [];
    return overview.topActivities.slice(0, 4);
  }, [overview]);

  const exportTableToCsv = useCallback(() => {
    const rows = rowsData.rows || [];
    if (!rows.length) return;

    const headers = [
      "Household Name",
      "City",
      "Residents",
      "Total Liters",
      "Carbon Kg",
      "Usage Records",
      "Avg Liters/Record",
      "Liters/Resident",
      "Latest Usage",
    ];

    const escapeCsv = (value) => {
      const text = String(value ?? "");
      if (/[",\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const lines = rows.map((row) =>
      [
        row.householdName,
        row.city,
        row.residents,
        row.totalLiters,
        row.totalCarbonKg,
        row.usageCount,
        row.avgLitersPerRecord,
        row.litersPerResident,
        row.latestUsageAt ? new Date(row.latestUsageAt).toISOString() : "",
      ]
        .map(escapeCsv)
        .join(",")
    );

    const csvContent = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-usage-households-${days}d.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [rowsData.rows, days]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Manage water usage</h1>
        <p className="mt-1 text-sm text-slate-600">
          Platform-wide usage monitoring with household drill-down analytics for administrators.
        </p>
      </div>

      <Card className="border border-slate-200/80 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {[7, 30, 90].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setDays(value)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  days === value ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Last {value} days
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={loadOverview}>
              Refresh overview
            </Button>
            <Button type="button" variant="ghost" onClick={loadAnomalies}>
              Refresh alerts
            </Button>
            <Button type="button" variant="ghost" onClick={loadHouseholds}>
              Refresh table
            </Button>
          </div>
        </div>
      </Card>

      {errorOverview ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{errorOverview}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total liters"
          value={loadingOverview ? "-" : `${Number(overview?.totals?.totalLiters || 0).toLocaleString()} L`}
          icon={Droplets}
          tone="bg-sky-50 text-sky-700"
        />
        <MetricCard
          label="Carbon emission"
          value={loadingOverview ? "-" : `${Number(overview?.totals?.totalCarbonKg || 0).toFixed(3)} kg`}
          icon={Leaf}
          tone="bg-emerald-50 text-emerald-700"
        />
        <MetricCard
          label="Active households"
          value={loadingOverview ? "-" : Number(overview?.totals?.activeHouseholds || 0).toLocaleString()}
          icon={Home}
          tone="bg-amber-50 text-amber-700"
        />
        <MetricCard
          label="Usage records"
          value={loadingOverview ? "-" : Number(overview?.totals?.usageCount || 0).toLocaleString()}
          icon={Activity}
          tone="bg-violet-50 text-violet-700"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-5">
          <div className="text-sm font-extrabold text-slate-900">Daily liters trend</div>
          <div className="mt-1 text-xs text-slate-500">Liters consumed per day in selected period</div>
          <div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-10 md:grid-cols-12 xl:grid-cols-15">
            {(overview?.trend || []).slice(-15).map((item) => {
              const max = Math.max(
                ...(overview?.trend || []).map((t) => Number(t?.totalLiters || 0)),
                1
              );
              const pct = Math.max((Number(item?.totalLiters || 0) / max) * 100, 8);
              return (
                <div key={item.date} className="text-center">
                  <div className="mx-auto flex h-24 w-6 items-end rounded-full bg-slate-100 p-1">
                    <div className="w-full rounded-full bg-gradient-to-t from-cyan-500 to-sky-300" style={{ height: `${pct}%` }} />
                  </div>
                  <div className="mt-2 text-[10px] text-slate-500">{String(item.date || "").slice(5)}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-sm font-extrabold text-slate-900">Top activities</div>
          <div className="mt-1 text-xs text-slate-500">Highest water-consuming activity types</div>
          <div className="mt-4 space-y-2">
            {activitySummary.length === 0 ? (
              <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">No data for this period.</div>
            ) : (
              activitySummary.map((activity) => (
                <div key={activity.activityType} className="rounded-xl bg-slate-50 px-3 py-3 ring-1 ring-slate-100">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-slate-900">{activity.activityType}</div>
                    <div className="text-xs text-slate-600">{activity.usageCount} uses</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {Number(activity.totalLiters || 0).toLocaleString()} L • {Number(activity.totalCarbonKg || 0).toFixed(3)} kg CO2
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {errorAnomalies ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{errorAnomalies}</div>
      ) : null}

      <Card className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Leak and anomaly insights</div>
            <div className="text-xs text-slate-500">High spike records and suspicious household behavior</div>
          </div>
          <div className="text-xs text-slate-500">
            Threshold: {loadingAnomalies ? "-" : `${Number(anomalies?.thresholds?.spikeLitersThreshold || 0)} L/record`}
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Suspicious households</div>
            <div className="space-y-2">
              {loadingAnomalies ? (
                <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">Loading anomaly households...</div>
              ) : (anomalies?.suspiciousHouseholds || []).length === 0 ? (
                <div className="rounded-xl bg-emerald-50 px-3 py-4 text-sm text-emerald-700">No suspicious household pattern detected.</div>
              ) : (
                (anomalies?.suspiciousHouseholds || []).slice(0, 5).map((item) => (
                  <div key={item.householdId} className="rounded-xl bg-amber-50 px-3 py-3 ring-1 ring-amber-100">
                    <div className="text-sm font-semibold text-slate-900">{item.householdName || "Unknown"}</div>
                    <div className="mt-1 text-xs text-slate-600">
                      Avg {Number(item.avgLitersPerRecord || 0).toLocaleString()} L/record • Peak {Number(item.maxSingleRecordLiters || 0).toLocaleString()} L
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Top spike records</div>
            <div className="space-y-2">
              {loadingAnomalies ? (
                <div className="rounded-xl bg-slate-50 px-3 py-4 text-sm text-slate-500">Loading spike records...</div>
              ) : (anomalies?.spikeRecords || []).length === 0 ? (
                <div className="rounded-xl bg-emerald-50 px-3 py-4 text-sm text-emerald-700">No extreme spike records in this period.</div>
              ) : (
                (anomalies?.spikeRecords || []).slice(0, 5).map((record) => (
                  <div key={record.usageId} className="rounded-xl bg-rose-50 px-3 py-3 ring-1 ring-rose-100">
                    <div className="text-sm font-semibold text-slate-900">
                      {record.householdName || "Unknown"} • {record.activityType || "Activity"}
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      {Number(record.liters || 0).toLocaleString()} L on {record.occurredAt ? new Date(record.occurredAt).toLocaleDateString() : "-"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search household by name or city..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none ring-brand-300 focus:ring-2"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
          >
            <option value="-totalLiters">Sort: Highest liters</option>
            <option value="totalLiters">Sort: Lowest liters</option>
            <option value="-totalCarbonKg">Sort: Highest carbon</option>
            <option value="-usageCount">Sort: Most records</option>
            <option value="-latestUsageAt">Sort: Latest usage</option>
            <option value="householdName">Sort: Name A-Z</option>
          </select>

          <Button type="button" variant="ghost" onClick={exportTableToCsv} disabled={!rowsData.rows.length}>
            Export CSV
          </Button>
        </div>
      </Card>

      {errorRows ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{errorRows}</div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Household</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Residents</th>
                <th className="px-4 py-3">Total liters</th>
                <th className="px-4 py-3">Carbon (kg)</th>
                <th className="px-4 py-3">Records</th>
                <th className="px-4 py-3">Latest usage</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loadingRows ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Loading household analytics...
                  </td>
                </tr>
              ) : rowsData.rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    No household usage data found.
                  </td>
                </tr>
              ) : (
                rowsData.rows.map((row) => (
                  <tr key={row.householdId} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{row.householdName || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{row.city || "-"}</td>
                    <td className="px-4 py-3">{Number(row.residents || 0)}</td>
                    <td className="px-4 py-3">{Number(row.totalLiters || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{Number(row.totalCarbonKg || 0).toFixed(3)}</td>
                    <td className="px-4 py-3">{Number(row.usageCount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.latestUsageAt ? new Date(row.latestUsageAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openDetails(row.householdId)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div className="text-sm text-slate-600">
          Page {rowsData.page} of {rowsData.totalPages || 1} • {rowsData.total} households
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={rowsData.page <= 1 || loadingRows}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={rowsData.page >= rowsData.totalPages || loadingRows}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <HouseholdDetailsModal
        open={detailOpen}
        data={detailData}
        loading={detailLoading}
        error={detailError}
        onClose={() => {
          setDetailOpen(false);
          setDetailData(null);
          setDetailError("");
        }}
      />
    </div>
  );
}
