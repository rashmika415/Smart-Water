import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { usageApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Search, ChevronLeft, ChevronRight, RefreshCw, Plus, Pencil, Trash2, Eye } from "lucide-react";

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
                min="0"
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
                  min="0"
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
                  min="0"
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
                  min="0"
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
                  min="0"
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
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Add context for this record"
            />
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

function validateUsageForm(form) {
  if (!form.activityType.trim()) return "Activity type is required.";

  if (form.occurredAt) {
    const occurredAt = new Date(form.occurredAt);
    if (Number.isNaN(occurredAt.getTime())) return "Occurred at must be a valid date and time.";
    if (occurredAt > new Date()) return "Occurred at cannot be in the future.";
  }

  const isNonNegative = (value) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0;

  if (form.inputMode === INPUT_MODES.DIRECT) {
    if (!isNonNegative(form.liters)) return "Liters must be a non-negative number.";
  }

  if (form.inputMode === INPUT_MODES.DURATION) {
    if (!isNonNegative(form.durationMinutes)) return "Duration must be a non-negative number.";
    if (!isNonNegative(form.flowRateLpm)) return "Flow rate must be a non-negative number.";
  }

  if (form.inputMode === INPUT_MODES.COUNT) {
    if (!isNonNegative(form.count)) return "Count must be a non-negative number.";
    if (!isNonNegative(form.litersPerUnit)) return "Liters per unit must be a non-negative number.";
  }

  return "";
}

export function UsageHistory() {
  const { token } = useAuth();

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [activityType, setActivityType] = useState("");
  const [source, setSource] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("-occurredAt");

  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingUsageId, setEditingUsageId] = useState("");
  const [viewingUsageId, setViewingUsageId] = useState("");
  const [selectedUsage, setSelectedUsage] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [form, setForm] = useState(defaultForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

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
  }, [activityType, source, startDate, endDate, sort]);

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

  function clearFilters() {
    setActivityType("");
    setSource("");
    setStartDate("");
    setEndDate("");
    setSort("-occurredAt");
  }

  function openCreate() {
    setCreateOpen(true);
    setEditingUsageId("");
    setForm(defaultForm());
    setFormError("");
  }

  function openEdit(item) {
    setCreateOpen(false);
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
    setCreateOpen(false);
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
      if (editingUsageId) {
        await usageApi.update(token, editingUsageId, payload);
        setNotice("Usage record updated successfully.");
      } else {
        await usageApi.create(token, payload);
        setNotice("Usage record created successfully.");
      }
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
            Track water records and manage create, edit, and delete operations.
          </p>
        </div>
        <Button type="button" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add usage
        </Button>
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

        <div className="relative mt-4 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search current page results..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none ring-brand-300 focus:ring-2"
          />
        </div>
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

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Activity</th>
                <th className="px-4 py-3">Liters</th>
                <th className="px-4 py-3">Carbon (kg)</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Occurred at</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Loading usage records...
                  </td>
                </tr>
              ) : visibleItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No usage records found.
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.activityType || "-"}</td>
                    <td className="px-4 py-3">{Number(item.liters || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{Number(item.carbonFootprint?.carbonKg || 0).toFixed(3)}</td>
                    <td className="px-4 py-3 capitalize text-slate-700">{item.source || "manual"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.occurredAt ? new Date(item.occurredAt).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openView(item)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
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
        <p className="text-sm text-slate-600">
          Page {page} of {totalPages || 1} - {total} total records
        </p>

        <div className="flex items-center gap-2">
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

      {createOpen ? (
        <UsageModal
          title="Add usage record"
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={submitForm}
          onClose={closeModal}
          error={formError}
        />
      ) : null}

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
