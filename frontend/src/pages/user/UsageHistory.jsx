import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { usageApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Search, ChevronLeft, ChevronRight, RefreshCw, Pencil, Trash2, Eye, Droplets, Leaf, CalendarDays, TrendingUp, MoreHorizontal } from "lucide-react";

const ACTIVITY_OPTIONS = [
  "",
  "Shower",
  "Bath",
  "Toilet Flush",
  "Dishwashing",
  "Washing Machine",
  "Garden Watering",
  "Car Washing",
  "Kitchen Use",
  "Drinking Water",
  "Other",
];

const SOURCE_OPTIONS = ["", "manual", "preset", "imported"];
const SAVED_VIEWS_STORAGE_KEY = "smartwater.usageSavedViews";

const SORT_OPTIONS = [
  { value: "-occurredAt", label: "Newest first" },
  { value: "occurredAt", label: "Oldest first" },
  { value: "-liters", label: "Highest liters" },
  { value: "liters", label: "Lowest liters" },
  { value: "activityType", label: "Activity A-Z" },
  { value: "-activityType", label: "Activity Z-A" },
];

const INPUT_MODES = {
  DIRECT: "direct",
  DURATION: "duration",
  COUNT: "count",
};

const VALID_ACTIVITY_TYPES = new Set(ACTIVITY_OPTIONS.filter(Boolean));
const VALID_SOURCES = new Set(SOURCE_OPTIONS.filter(Boolean));
const MAX_NOTES_LENGTH = 500;
const MAX_LITERS_VALUE = 100000;
const MAX_DURATION_MINUTES = 1440;
const MAX_FLOW_RATE_LPM = 200;
const MAX_COUNT_VALUE = 10000;
const MAX_LITERS_PER_UNIT = 10000;

function sourceBadgeClass(source) {
  const value = String(source || "manual").toLowerCase();
  if (value === "preset") return "bg-indigo-100 text-indigo-800";
  if (value === "imported") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

function SummaryCard({
  label,
  value,
  helper,
  icon: Icon,
  cardTone = "from-sky-50 to-cyan-50 border-sky-100",
  iconTone = "bg-sky-100 text-sky-700",
}) {
  return (
    <Card className={`border bg-gradient-to-br p-4 ${cardTone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</div>
          {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconTone}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
    </Card>
  );
}

function formatDateInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function startOfMonthInput() {
  const now = new Date();
  return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
}

function csvEscape(value) {
  const raw = String(value ?? "");
  if (raw.includes(",") || raw.includes("\n") || raw.includes("\"")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function defaultForm() {
  return {
    activityType: "",
    occurredAt: "",
    source: "manual",
    notes: "",
    inputMode: INPUT_MODES.DIRECT,
    liters: "",
    durationMinutes: "",
    flowRateLpm: "",
    count: "",
    litersPerUnit: "",
  };
}

function currentDateTimeLocal() {
  const now = new Date();
  now.setSeconds(0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function estimateFormLiters(form) {
  if (form.inputMode === INPUT_MODES.DIRECT) {
    const liters = Number(form.liters || 0);
    return Number.isFinite(liters) ? liters : 0;
  }

  if (form.inputMode === INPUT_MODES.DURATION) {
    const duration = Number(form.durationMinutes || 0);
    const flow = Number(form.flowRateLpm || 0);
    return Number.isFinite(duration * flow) ? duration * flow : 0;
  }

  const count = Number(form.count || 0);
  const perUnit = Number(form.litersPerUnit || 0);
  return Number.isFinite(count * perUnit) ? count * perUnit : 0;
}

function UsageModal({ title, form, setForm, saving, onSubmit, onClose, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="text-lg font-extrabold text-slate-900">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 px-5 py-4">
          {error ? (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
              {error}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Activity type</label>
              <select
                value={form.activityType}
                onChange={(e) => setForm((f) => ({ ...f, activityType: e.target.value }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                required
              >
                <option value="">Select activity</option>
                {ACTIVITY_OPTIONS.filter(Boolean).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Occurred at</label>
              <input
                type="datetime-local"
                value={form.occurredAt}
                onChange={(e) => setForm((f) => ({ ...f, occurredAt: e.target.value }))}
                max={currentDateTimeLocal()}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-slate-700">Input mode</label>
              <select
                value={form.inputMode}
                onChange={(e) => setForm((f) => ({ ...f, inputMode: e.target.value }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value={INPUT_MODES.DIRECT}>Direct liters</option>
                <option value={INPUT_MODES.DURATION}>Duration x flow rate</option>
                <option value={INPUT_MODES.COUNT}>Count x liters per unit</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">Source</label>
              <select
                value={form.source}
                onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                {SOURCE_OPTIONS.filter(Boolean).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {form.inputMode === INPUT_MODES.DIRECT ? (
            <div>
              <label className="text-sm font-semibold text-slate-700">Liters</label>
              <input
                type="number"
                min="0.01"
                max={MAX_LITERS_VALUE}
                step="0.01"
                value={form.liters}
                onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                required
              />
            </div>
          ) : null}

          {form.inputMode === INPUT_MODES.DURATION ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Duration (minutes)</label>
                <input
                  type="number"
                  min="0.01"
                  max={MAX_DURATION_MINUTES}
                  step="0.01"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Flow rate (L/min)</label>
                <input
                  type="number"
                  min="0.01"
                  max={MAX_FLOW_RATE_LPM}
                  step="0.01"
                  value={form.flowRateLpm}
                  onChange={(e) => setForm((f) => ({ ...f, flowRateLpm: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  required
                />
              </div>
            </div>
          ) : null}

          {form.inputMode === INPUT_MODES.COUNT ? (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700">Count</label>
                <input
                  type="number"
                  min="1"
                  max={MAX_COUNT_VALUE}
                  step="1"
                  value={form.count}
                  onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Liters per unit</label>
                <input
                  type="number"
                  min="0.01"
                  max={MAX_LITERS_PER_UNIT}
                  step="0.01"
                  value={form.litersPerUnit}
                  onChange={(e) => setForm((f) => ({ ...f, litersPerUnit: e.target.value }))}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  required
                />
              </div>
            </div>
          ) : null}

          <div>
            <label className="text-sm font-semibold text-slate-700">Notes (optional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
              maxLength={MAX_NOTES_LENGTH}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Add context for this record"
            />
            <div className="mt-1 text-right text-xs text-slate-500">
              {form.notes.length}/{MAX_NOTES_LENGTH}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsageDetailsModal({ usage, loading, onClose, error }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="text-lg font-extrabold text-slate-900">Usage record details</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="space-y-3 px-5 py-4 text-sm">
          {loading ? <p className="text-slate-500">Loading details...</p> : null}
          {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-rose-800 ring-1 ring-rose-100">{error}</div> : null}

          {!loading && !error && usage ? (
            <dl className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Activity</dt>
                <dd className="font-semibold text-slate-900">{usage.activityType || "-"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Liters</dt>
                <dd>{Number(usage.liters || 0).toLocaleString()}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Source</dt>
                <dd className="capitalize">{usage.source || "manual"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Occurred at</dt>
                <dd>{usage.occurredAt ? new Date(usage.occurredAt).toLocaleString() : "-"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Duration (minutes)</dt>
                <dd>{usage.durationMinutes != null ? usage.durationMinutes : "-"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Flow rate (L/min)</dt>
                <dd>{usage.flowRateLpm != null ? usage.flowRateLpm : "-"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Count</dt>
                <dd>{usage.count != null ? usage.count : "-"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Liters per unit</dt>
                <dd>{usage.litersPerUnit != null ? usage.litersPerUnit : "-"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Carbon (kg)</dt>
                <dd>{Number(usage.carbonFootprint?.carbonKg || 0).toFixed(3)}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Energy (kWh)</dt>
                <dd>{Number(usage.carbonFootprint?.energyKwh || 0).toFixed(2)}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Equivalent car distance</dt>
                <dd>{Number(usage.carbonFootprint?.equivalents?.carKm || 0).toFixed(2)} km</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Equivalent trees</dt>
                <dd>{Number(usage.carbonFootprint?.equivalents?.trees || 0).toFixed(3)}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Equivalent phone charges</dt>
                <dd>{Number(usage.carbonFootprint?.equivalents?.smartphones || 0).toFixed(0)}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <dt className="text-slate-500">Notes</dt>
                <dd>{usage.notes || "-"}</dd>
              </div>
            </dl>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildUsagePayload(form) {
  const payload = {
    activityType: form.activityType.trim(),
    source: form.source || "manual",
  };

  if (form.notes.trim()) payload.notes = form.notes.trim();
  if (form.occurredAt) payload.occurredAt = new Date(form.occurredAt).toISOString();

  if (form.inputMode === INPUT_MODES.DIRECT) {
    payload.liters = Number(form.liters);
  } else if (form.inputMode === INPUT_MODES.DURATION) {
    payload.durationMinutes = Number(form.durationMinutes);
    payload.flowRateLpm = Number(form.flowRateLpm);
  } else {
    payload.count = Number(form.count);
    payload.litersPerUnit = Number(form.litersPerUnit);
  }

  return payload;
}

function buildPayloadFromUsageRecord(usage) {
  const payload = {
    activityType: usage.activityType,
    source: usage.source || "manual",
  };

  if (usage.notes) payload.notes = usage.notes;
  if (usage.occurredAt) payload.occurredAt = new Date(usage.occurredAt).toISOString();

  if (usage.durationMinutes != null && usage.flowRateLpm != null) {
    payload.durationMinutes = Number(usage.durationMinutes);
    payload.flowRateLpm = Number(usage.flowRateLpm);
  } else if (usage.count != null && usage.litersPerUnit != null) {
    payload.count = Number(usage.count);
    payload.litersPerUnit = Number(usage.litersPerUnit);
  } else {
    payload.liters = Number(usage.liters || 0);
  }

  return payload;
}

function validateUsageForm(form) {
  if (!form.activityType.trim()) return "Activity type is required.";
  if (!VALID_ACTIVITY_TYPES.has(form.activityType.trim())) return "Please choose a valid activity type.";
  if (!VALID_SOURCES.has(form.source)) return "Please choose a valid source.";
  if (form.notes && form.notes.length > MAX_NOTES_LENGTH) {
    return `Notes cannot exceed ${MAX_NOTES_LENGTH} characters.`;
  }

  if (form.occurredAt) {
    const occurredAt = new Date(form.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) return "Occurred at must be a valid date and time.";
    if (occurredAt > new Date()) return "Occurred at cannot be in the future.";
  }

  const isPositive = (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) > 0;

  if (form.inputMode === INPUT_MODES.DIRECT) {
    if (!isPositive(form.liters)) return "Liters must be greater than 0.";
    if (Number(form.liters) > MAX_LITERS_VALUE) return `Liters cannot exceed ${MAX_LITERS_VALUE}.`;
  }

  if (form.inputMode === INPUT_MODES.DURATION) {
    if (!isPositive(form.durationMinutes)) return "Duration must be greater than 0.";
    if (!isPositive(form.flowRateLpm)) return "Flow rate must be greater than 0.";
    if (Number(form.durationMinutes) > MAX_DURATION_MINUTES) {
      return `Duration cannot exceed ${MAX_DURATION_MINUTES} minutes.`;
    }
    if (Number(form.flowRateLpm) > MAX_FLOW_RATE_LPM) {
      return `Flow rate cannot exceed ${MAX_FLOW_RATE_LPM} L/min.`;
    }
  }

  if (form.inputMode === INPUT_MODES.COUNT) {
    if (!isPositive(form.count)) return "Count must be greater than 0.";
    if (!Number.isInteger(Number(form.count))) return "Count must be a whole number.";
    if (Number(form.count) > MAX_COUNT_VALUE) return `Count cannot exceed ${MAX_COUNT_VALUE}.`;
    if (!isPositive(form.litersPerUnit)) return "Liters per unit must be greater than 0.";
    if (Number(form.litersPerUnit) > MAX_LITERS_PER_UNIT) {
      return `Liters per unit cannot exceed ${MAX_LITERS_PER_UNIT}.`;
    }
  }

  const estimated = estimateFormLiters(form);
  if (!Number.isFinite(estimated) || estimated <= 0) return "Estimated liters must be greater than 0.";
  if (estimated > MAX_LITERS_VALUE) return `Estimated liters cannot exceed ${MAX_LITERS_VALUE}.`;

  return "";
}

export function UsageHistory() {
  const { token } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activityType, setActivityType] = useState("");
  const [source, setSource] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("-occurredAt");
  const [savedViews, setSavedViews] = useState([]);
  const [viewName, setViewName] = useState("");
  const [selectedViewId, setSelectedViewId] = useState("");

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editingUsageId, setEditingUsageId] = useState("");
  const [viewingUsageId, setViewingUsageId] = useState("");
  const [selectedUsage, setSelectedUsage] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [form, setForm] = useState(defaultForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [undoingBulkDelete, setUndoingBulkDelete] = useState(false);
  const [lastBulkDeleted, setLastBulkDeleted] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setSavedViews(parsed);
    } catch {
      setSavedViews([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify(savedViews));
  }, [savedViews]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await usageApi.list(token, {
        page,
        limit,
        activityType,
        source,
        startDate,
        endDate,
        sort,
      });

      const data = Array.isArray(res?.data) ? res.data : [];
      setItems(data);
      setTotal(typeof res?.total === "number" ? res.total : data.length);
      setTotalPages(typeof res?.totalPages === "number" ? res.totalPages : 1);
    } catch (e) {
      setError(e?.message || "Failed to load usage records");
      setItems([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, activityType, source, startDate, endDate, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [activityType, source, startDate, endDate, sort, limit]);

  useEffect(() => {
    setSelectedIds([]);
  }, [items, page, activityType, source, startDate, endDate, sort, search]);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const type = String(item.activityType || "").toLowerCase();
      const src = String(item.source || "").toLowerCase();
      const liters = String(item.liters ?? "").toLowerCase();
      const notes = String(item.notes || "").toLowerCase();
      return type.includes(q) || src.includes(q) || liters.includes(q) || notes.includes(q);
    });
  }, [items, search]);

  const selectedVisibleItems = useMemo(
    () => visibleItems.filter((item) => selectedIds.includes(item._id)),
    [visibleItems, selectedIds]
  );

  const summary = useMemo(() => {
    const totalLiters = visibleItems.reduce((sum, item) => sum + Number(item?.liters || 0), 0);
    const totalCarbon = visibleItems.reduce((sum, item) => sum + Number(item?.carbonFootprint?.carbonKg || 0), 0);

    const byDate = visibleItems.reduce((acc, item) => {
      const key = item?.occurredAt ? new Date(item.occurredAt).toISOString().slice(0, 10) : "unknown";
      acc[key] = (acc[key] || 0) + Number(item?.liters || 0);
      return acc;
    }, {});

    const dayKeys = Object.keys(byDate).filter((k) => k !== "unknown");
    const avgLitersPerDay = dayKeys.length ? totalLiters / dayKeys.length : 0;
    const highestDayEntry = dayKeys
      .map((date) => ({ date, liters: byDate[date] }))
      .sort((a, b) => b.liters - a.liters)[0] || null;

    return {
      totalLiters,
      totalCarbon,
      avgLitersPerDay,
      highestDayEntry,
    };
  }, [visibleItems]);

  const selectedVisibleCount = selectedVisibleItems.length;

  const trendPoints = useMemo(() => {
    const grouped = visibleItems.reduce((acc, item) => {
      const key = item?.occurredAt ? new Date(item.occurredAt).toISOString().slice(0, 10) : "";
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + Number(item?.liters || 0);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([date, liters]) => ({ date, liters: Number(liters) }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14);
  }, [visibleItems]);

  const rangeLabel = useMemo(() => {
    if (!total) return "Showing 0 results";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `Showing ${start}-${end} of ${total} records`;
  }, [page, limit, total]);

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (activityType) chips.push({ key: "activity", label: `Activity: ${activityType}` });
    if (source) chips.push({ key: "source", label: `Source: ${source}` });
    if (startDate || endDate) {
      chips.push({ key: "date", label: `Date: ${startDate || "..."} -> ${endDate || "..."}` });
    }
    if (sort && sort !== "-occurredAt") {
      const found = SORT_OPTIONS.find((x) => x.value === sort);
      chips.push({ key: "sort", label: `Sort: ${found?.label || sort}` });
    }
    if (search.trim()) chips.push({ key: "search", label: `Search: ${search.trim()}` });
    return chips;
  }, [activityType, source, startDate, endDate, sort, search]);

  function clearFilters() {
    setActivityType("");
    setSource("");
    setStartDate("");
    setEndDate("");
    setSort("-occurredAt");
    setSelectedViewId("");
  }

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
      return;
    }

    if (preset === "30d") {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      setStartDate(formatDateInput(start));
      setEndDate(end);
      return;
    }

    if (preset === "month") {
      setStartDate(startOfMonthInput());
      setEndDate(end);
    }
  }

  function saveCurrentView() {
    const name = viewName.trim();
    if (!name) {
      setError("View name is required.");
      return;
    }

    const view = {
      id: `view-${Date.now()}`,
      name,
      filters: {
        activityType,
        source,
        startDate,
        endDate,
        sort,
      },
    };

    setSavedViews((prev) => [view, ...prev]);
    setSelectedViewId(view.id);
    setViewName("");
    setNotice(`Saved view "${name}".`);
    setError("");
  }

  function applySavedView(viewId) {
    setSelectedViewId(viewId);
    const view = savedViews.find((item) => item.id === viewId);
    if (!view) return;
    setActivityType(view.filters?.activityType || "");
    setSource(view.filters?.source || "");
    setStartDate(view.filters?.startDate || "");
    setEndDate(view.filters?.endDate || "");
    setSort(view.filters?.sort || "-occurredAt");
    setNotice(`Applied view "${view.name}".`);
  }

  function deleteSavedView() {
    if (!selectedViewId) return;
    const deleting = savedViews.find((item) => item.id === selectedViewId);
    setSavedViews((prev) => prev.filter((item) => item.id !== selectedViewId));
    setSelectedViewId("");
    if (deleting?.name) {
      setNotice(`Deleted view "${deleting.name}".`);
    }
  }

  function toggleSelected(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  }

  function toggleSelectAllVisible() {
    const visibleIds = visibleItems.map((item) => item._id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
      return;
    }
    setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  }

  function exportSelectedToCsv() {
    const selectedRows = selectedVisibleItems;
    if (selectedRows.length === 0) {
      setError("Select at least one row to export.");
      return;
    }

    const headers = ["Activity", "Liters", "CarbonKg", "Source", "OccurredAt", "Notes"];
    const rows = selectedRows.map((item) => [
      item.activityType || "",
      Number(item.liters || 0),
      Number(item.carbonFootprint?.carbonKg || 0).toFixed(3),
      item.source || "manual",
      item.occurredAt ? new Date(item.occurredAt).toISOString() : "",
      item.notes || "",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `usage-history-selected-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${selectedRows.length} selected record(s).`);
    setError("");
  }

  async function bulkDeleteSelected() {
    if (selectedVisibleItems.length === 0) {
      setError("Select at least one row to bulk delete.");
      return;
    }

    if (!window.confirm(`Delete ${selectedVisibleItems.length} selected record(s)?`)) return;

    setBulkDeleting(true);
    setError("");
    setNotice("");

    try {
      await Promise.all(selectedVisibleItems.map((item) => usageApi.delete(token, item._id)));
      setLastBulkDeleted(selectedVisibleItems);
      setSelectedIds([]);
      setNotice(`Deleted ${selectedVisibleItems.length} record(s). You can undo this action.`);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to bulk delete selected records");
    } finally {
      setBulkDeleting(false);
    }
  }

  async function undoBulkDelete() {
    if (lastBulkDeleted.length === 0) return;

    setUndoingBulkDelete(true);
    setError("");

    try {
      await Promise.all(lastBulkDeleted.map((item) => usageApi.create(token, buildPayloadFromUsageRecord(item))));
      setNotice(`Restored ${lastBulkDeleted.length} record(s).`);
      setLastBulkDeleted([]);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to undo bulk delete");
    } finally {
      setUndoingBulkDelete(false);
    }
  }

  function openEdit(item) {
    setEditingUsageId(item._id);
    setFormError("");

    const hasDuration = item.durationMinutes != null && item.flowRateLpm != null;
    const hasCount = item.count != null && item.litersPerUnit != null;
    const inputMode = hasDuration
      ? INPUT_MODES.DURATION
      : hasCount
        ? INPUT_MODES.COUNT
        : INPUT_MODES.DIRECT;

    setForm({
      activityType: item.activityType || "",
      occurredAt: toInputDateTime(item.occurredAt),
      source: item.source || "manual",
      notes: item.notes || "",
      inputMode,
      liters: item.liters != null ? String(item.liters) : "",
      durationMinutes: item.durationMinutes != null ? String(item.durationMinutes) : "",
      flowRateLpm: item.flowRateLpm != null ? String(item.flowRateLpm) : "",
      count: item.count != null ? String(item.count) : "",
      litersPerUnit: item.litersPerUnit != null ? String(item.litersPerUnit) : "",
    });
  }

  function closeModal() {
    setEditingUsageId("");
    setFormError("");
  }

  async function openView(item) {
    setViewingUsageId(item._id);
    setSelectedUsage(null);
    setDetailsError("");
    setDetailsLoading(true);

    try {
      const res = await usageApi.getById(token, item._id);
      const data = res?.data || null;
      if (!data) throw new Error("No usage details returned");
      setSelectedUsage(data);
    } catch (e) {
      setDetailsError(e?.message || "Failed to load usage details");
    } finally {
      setDetailsLoading(false);
    }
  }

  function closeView() {
    setViewingUsageId("");
    setSelectedUsage(null);
    setDetailsError("");
  }

  async function submitForm(e) {
    e.preventDefault();
    setNotice("");
    const validationError = validateUsageForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      const payload = buildUsagePayload(form);
      await usageApi.update(token, editingUsageId, payload);
      setNotice("Usage record updated successfully.");
      closeModal();
      await load();
    } catch (e2) {
      setFormError(e2?.message || "Failed to save usage record");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(item) {
    setNotice("");
    if (!window.confirm(`Delete usage record for ${item.activityType}?`)) return;

    try {
      await usageApi.delete(token, item._id);
      setNotice("Usage record deleted successfully.");
      await load();
    } catch (e) {
      setError(e?.message || "Failed to delete usage record");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Water usage history</h1>
          <p className="mt-1 text-sm text-slate-600">
            Review, filter, edit, and manage your previously logged water records.
          </p>
        </div>
        <Link
          to="/user/water-activities"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Go to Water Activities
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total liters"
          value={`${summary.totalLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })} L`}
          helper="Visible filtered records"
          icon={Droplets}
          cardTone="from-sky-50 to-cyan-50 border-sky-100"
          iconTone="bg-sky-100 text-sky-700"
        />
        <SummaryCard
          label="Total carbon"
          value={`${summary.totalCarbon.toFixed(3)} kg`}
          helper="Visible filtered records"
          icon={Leaf}
          cardTone="from-emerald-50 to-lime-50 border-emerald-100"
          iconTone="bg-emerald-100 text-emerald-700"
        />
        <SummaryCard
          label="Average per day"
          value={`${summary.avgLitersPerDay.toLocaleString(undefined, { maximumFractionDigits: 1 })} L`}
          helper="Across visible days"
          icon={CalendarDays}
          cardTone="from-amber-50 to-orange-50 border-amber-100"
          iconTone="bg-amber-100 text-amber-700"
        />
        <SummaryCard
          label="Highest day"
          value={summary.highestDayEntry ? `${summary.highestDayEntry.liters.toLocaleString(undefined, { maximumFractionDigits: 1 })} L` : "-"}
          helper={summary.highestDayEntry ? summary.highestDayEntry.date : "No data"}
          icon={TrendingUp}
          cardTone="from-slate-50 to-zinc-100 border-slate-200"
          iconTone="bg-slate-200 text-slate-700"
        />
      </div>

      <Card className="mt-6 p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Activity type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              {ACTIVITY_OPTIONS.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "All activities"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              {SOURCE_OPTIONS.map((option) => (
                <option key={option || "all"} value={option}>
                  {option || "All sources"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

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

          <div className="flex items-end gap-2">
            <Button type="button" variant="ghost" className="flex-1 gap-2" onClick={load}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button type="button" variant="ghost" className="flex-1" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => applyDatePreset("today")}>Today</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => applyDatePreset("7d")}>Last 7 days</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => applyDatePreset("30d")}>Last 30 days</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => applyDatePreset("month")}>This month</Button>
        </div>

        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto_auto]">
          <input
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            placeholder="Save current filters as a view"
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
          />
          <Button type="button" variant="ghost" onClick={saveCurrentView}>Save view</Button>
          <div className="flex gap-2">
            <select
              value={selectedViewId}
              onChange={(e) => applySavedView(e.target.value)}
              className="h-10 min-w-[180px] rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="">Saved views</option>
              {savedViews.map((view) => (
                <option key={view.id} value={view.id}>{view.name}</option>
              ))}
            </select>
            <Button type="button" variant="ghost" onClick={deleteSavedView} disabled={!selectedViewId}>Delete</Button>
          </div>
        </div>

        <div className="relative mt-4 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search current page results..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none ring-brand-300 focus:ring-2"
          />
        </div>

        {activeFilterChips.length > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeFilterChips.map((chip) => (
              <span key={chip.key} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {chip.label}
              </span>
            ))}
            <button
              type="button"
              onClick={() => {
                clearFilters();
                setSearch("");
              }}
              className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </Card>

      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
          {notice}
        </div>
      ) : null}

      <Card className="mt-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-extrabold text-slate-900">Daily liters trend</div>
            <div className="text-xs text-slate-500">Last {trendPoints.length || 0} visible days</div>
          </div>
        </div>

        {trendPoints.length === 0 ? (
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
            No trend data for current filters.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-10 md:grid-cols-14">
            {trendPoints.map((point) => {
              const max = Math.max(...trendPoints.map((p) => p.liters), 1);
              const pct = Math.max((point.liters / max) * 100, 8);
              return (
                <div key={point.date} className="text-center">
                  <div className="mx-auto flex h-24 w-6 items-end rounded-full bg-slate-100 p-1">
                    <div
                      className="w-full rounded-full bg-gradient-to-t from-cyan-500 to-sky-300"
                      style={{ height: `${pct}%` }}
                      title={`${point.date}: ${point.liters.toLocaleString()} L`}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">{point.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="mt-4 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Selected rows: {selectedVisibleCount}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={exportSelectedToCsv}
            disabled={selectedVisibleCount === 0}
          >
            Export selected CSV
          </Button>
          <Button
            type="button"
            size="sm"
            variant="dark"
            onClick={bulkDeleteSelected}
            disabled={selectedVisibleCount === 0 || bulkDeleting}
          >
            {bulkDeleting ? "Deleting..." : "Bulk delete selected"}
          </Button>
        </div>
      </div>

      {lastBulkDeleted.length > 0 ? (
        <div className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{lastBulkDeleted.length} record(s) deleted.</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={undoBulkDelete}
              disabled={undoingBulkDelete}
            >
              {undoingBulkDelete ? "Restoring..." : "Undo delete"}
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="mt-6 p-4 md:hidden">
        <div className="space-y-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`mobile-skeleton-${idx}`} className="h-24 animate-pulse rounded-xl bg-slate-100" />
            ))
          ) : visibleItems.length === 0 ? (
            <p className="text-sm text-slate-500">No usage records found.</p>
          ) : (
            visibleItems.map((item) => (
              <div key={item._id} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    {item.activityType || "-"}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sourceBadgeClass(item.source)}`}>
                    {item.source || "manual"}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {item.occurredAt ? new Date(item.occurredAt).toLocaleString() : "-"}
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-800">
                  {Number(item.liters || 0).toLocaleString()} L • {Number(item.carbonFootprint?.carbonKg || 0).toFixed(3)} kg
                </div>
                <div className="mt-3 flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => openView(item)}
                    className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"
                    title="View"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card className="mt-6 hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={visibleItems.length > 0 && visibleItems.every((item) => selectedIds.includes(item._id))}
                    onChange={toggleSelectAllVisible}
                    aria-label="Select all visible rows"
                  />
                </th>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3 text-right">Liters</th>
                <th className="px-4 py-3 text-right">Carbon (kg)</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Occurred at</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: limit }).map((_, idx) => (
                  <tr key={`usage-skeleton-${idx}`}>
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-6 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No usage records found.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item, idx) => (
                  <tr key={item._id} className={idx % 2 === 0 ? "hover:bg-slate-50/80" : "bg-slate-50/30 hover:bg-slate-50/80"}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => toggleSelected(item._id)}
                        aria-label={`Select ${item.activityType || "usage"}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                        {item.activityType || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">{Number(item.liters || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{Number(item.carbonFootprint?.carbonKg || 0).toFixed(3)}</td>
                    <td className="px-4 py-3 capitalize text-slate-700">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sourceBadgeClass(item.source)}`}>
                        {item.source || "manual"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.occurredAt ? new Date(item.occurredAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openView(item)}
                          className="rounded-lg p-2 text-brand-700 hover:bg-brand-50"
                          title="View details"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <span className="inline-flex items-center px-1 text-slate-300">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-slate-600">{rangeLabel}</p>

        <div className="flex items-center gap-2">
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page >= (totalPages || 1) || loading}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {editingUsageId ? (
        <UsageModal
          title="Edit usage record"
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={submitForm}
          onClose={closeModal}
          error={formError}
        />
      ) : null}

      {viewingUsageId ? (
        <UsageDetailsModal
          usage={selectedUsage}
          loading={detailsLoading}
          error={detailsError}
          onClose={closeView}
        />
      ) : null}
    </div>
  );
}
