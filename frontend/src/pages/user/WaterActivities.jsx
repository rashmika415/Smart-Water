import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { usageApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Plus, RefreshCw, Droplets, BarChart3, Filter, X, Waves, Timer, Hash } from "lucide-react";

const CUSTOM_PRESETS_STORAGE_KEY = "smartwater.customUsagePresets";
const WEEKLY_GOALS_STORAGE_KEY = "smartwater.weeklyGoals";

const CATEGORY_TABS = [
  { id: "all", label: "All" },
  { id: "bathroom", label: "Bathroom" },
  { id: "kitchen", label: "Kitchen" },
  { id: "laundry", label: "Laundry" },
  { id: "outdoor", label: "Outdoor" },
  { id: "other", label: "Other" },
];

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
const MIN_OCCURRED_AT_ISO = "2020-01-01T00:00";

const QUICK_PRESETS = [
  {
    id: "shower-8m",
    label: "Quick Shower",
    activityType: "Shower",
    inputMode: INPUT_MODES.DURATION,
    durationMinutes: 8,
    flowRateLpm: 7,
  },
  {
    id: "toilet-1x",
    label: "Toilet Flush",
    activityType: "Toilet Flush",
    inputMode: INPUT_MODES.COUNT,
    count: 1,
    litersPerUnit: 6,
  },
  {
    id: "dishwasher-1x",
    label: "Dishwasher",
    activityType: "Dishwashing",
    inputMode: INPUT_MODES.COUNT,
    count: 1,
    litersPerUnit: 15,
  },
  {
    id: "laundry-1x",
    label: "Laundry Cycle",
    activityType: "Washing Machine",
    inputMode: INPUT_MODES.COUNT,
    count: 1,
    litersPerUnit: 50,
  },
  {
    id: "kitchen-5l",
    label: "Kitchen Use",
    activityType: "Kitchen Use",
    inputMode: INPUT_MODES.DIRECT,
    liters: 5,
  },
  {
    id: "garden-10m",
    label: "Garden Watering",
    activityType: "Garden Watering",
    inputMode: INPUT_MODES.DURATION,
    durationMinutes: 10,
    flowRateLpm: 10,
  },
];

function getActivityCategory(activityType) {
  const value = String(activityType || "").toLowerCase();
  if (["shower", "bath", "toilet flush"].includes(value)) return "bathroom";
  if (["dishwashing", "kitchen use", "drinking water"].includes(value)) return "kitchen";
  if (["washing machine"].includes(value)) return "laundry";
  if (["garden watering", "car washing"].includes(value)) return "outdoor";
  return "other";
}

function estimatePresetLiters(preset) {
  if (preset.inputMode === INPUT_MODES.DIRECT) return Number(preset.liters || 0);
  if (preset.inputMode === INPUT_MODES.DURATION) {
    return Number(preset.durationMinutes || 0) * Number(preset.flowRateLpm || 0);
  }
  return Number(preset.count || 0) * Number(preset.litersPerUnit || 0);
}

function buildPresetPayload(preset) {
  const payload = {
    activityType: preset.activityType,
    source: "preset",
    occurredAt: new Date().toISOString(),
    notes: "Quick add preset",
  };

  if (preset.inputMode === INPUT_MODES.DIRECT) {
    payload.liters = Number(preset.liters || 0);
  } else if (preset.inputMode === INPUT_MODES.DURATION) {
    payload.durationMinutes = Number(preset.durationMinutes || 0);
    payload.flowRateLpm = Number(preset.flowRateLpm || 0);
  } else {
    payload.count = Number(preset.count || 0);
    payload.litersPerUnit = Number(preset.litersPerUnit || 0);
  }

  return payload;
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

function getPresetVisual(preset) {
  if (preset.inputMode === INPUT_MODES.DURATION) {
    return { icon: Timer, tone: "bg-sky-100 text-sky-700" };
  }
  if (preset.inputMode === INPUT_MODES.COUNT) {
    return { icon: Hash, tone: "bg-violet-100 text-violet-700" };
  }
  return { icon: Waves, tone: "bg-emerald-100 text-emerald-700" };
}

function getSourceTheme(source) {
  const value = String(source || "manual").toLowerCase();
  if (value === "preset") return "bg-indigo-100 text-indigo-800";
  if (value === "imported") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-800";
}

function formatDateGroupLabel(dateValue) {
  const now = new Date();
  const target = new Date(dateValue);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const dayDiff = Math.floor((startOfToday - startOfTarget) / (24 * 60 * 60 * 1000));

  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  return "Earlier";
}

function SummaryMetric({
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
    const minDate = new Date(MIN_OCCURRED_AT_ISO);
    if (occurredAt < minDate) {
      return "Occurred at cannot be earlier than Jan 1, 2020.";
    }
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

function UsageModal({ title, form, setForm, saving, onSubmit, onClose, error }) {
  const estimatedLiters = useMemo(() => estimateFormLiters(form), [form]);

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

          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated liters</div>
            <div className="mt-1 text-lg font-black text-slate-900">
              {estimatedLiters.toLocaleString(undefined, { maximumFractionDigits: 2 })} L
            </div>
            <div className="mt-0.5 text-xs text-slate-500">Updates automatically based on your selected input mode.</div>
          </div>

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
                min={MIN_OCCURRED_AT_ISO}
                max={currentDateTimeLocal()}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
              <div className="mt-1 text-xs text-slate-500">Allowed range: Jan 1, 2020 to current date/time.</div>
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

function PresetManagerModal({
  open,
  onClose,
  customPresets,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
}) {
  const [form, setForm] = useState({
    label: "",
    activityType: "",
    inputMode: INPUT_MODES.DIRECT,
    liters: "",
    durationMinutes: "",
    flowRateLpm: "",
    count: "",
    litersPerUnit: "",
  });
  const [error, setError] = useState("");
  const [editingPresetId, setEditingPresetId] = useState("");

  if (!open) return null;

  function resetForm() {
    setForm({
      label: "",
      activityType: "",
      inputMode: INPUT_MODES.DIRECT,
      liters: "",
      durationMinutes: "",
      flowRateLpm: "",
      count: "",
      litersPerUnit: "",
    });
    setEditingPresetId("");
  }

  function isValidNumber(v) {
    return v !== "" && Number.isFinite(Number(v)) && Number(v) >= 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.label.trim()) {
      setError("Preset name is required.");
      return;
    }
    if (!form.activityType.trim()) {
      setError("Activity type is required.");
      return;
    }

    if (form.inputMode === INPUT_MODES.DIRECT && !isValidNumber(form.liters)) {
      setError("Liters must be a non-negative number.");
      return;
    }

    if (form.inputMode === INPUT_MODES.DURATION) {
      if (!isValidNumber(form.durationMinutes) || !isValidNumber(form.flowRateLpm)) {
        setError("Duration and flow rate must be non-negative numbers.");
        return;
      }
    }

    if (form.inputMode === INPUT_MODES.COUNT) {
      if (!isValidNumber(form.count) || !isValidNumber(form.litersPerUnit)) {
        setError("Count and liters per unit must be non-negative numbers.");
        return;
      }
    }

    const preset = {
      id: editingPresetId || `custom-${Date.now()}`,
      label: form.label.trim(),
      activityType: form.activityType.trim(),
      inputMode: form.inputMode,
    };

    if (form.inputMode === INPUT_MODES.DIRECT) {
      preset.liters = Number(form.liters);
    } else if (form.inputMode === INPUT_MODES.DURATION) {
      preset.durationMinutes = Number(form.durationMinutes);
      preset.flowRateLpm = Number(form.flowRateLpm);
    } else {
      preset.count = Number(form.count);
      preset.litersPerUnit = Number(form.litersPerUnit);
    }

    if (editingPresetId) {
      onUpdatePreset(preset);
    } else {
      onAddPreset(preset);
    }
    resetForm();
  }

  function editPreset(preset) {
    setEditingPresetId(preset.id);
    setError("");
    setForm({
      label: preset.label || "",
      activityType: preset.activityType || "",
      inputMode: preset.inputMode || INPUT_MODES.DIRECT,
      liters: preset.liters != null ? String(preset.liters) : "",
      durationMinutes: preset.durationMinutes != null ? String(preset.durationMinutes) : "",
      flowRateLpm: preset.flowRateLpm != null ? String(preset.flowRateLpm) : "",
      count: preset.count != null ? String(preset.count) : "",
      litersPerUnit: preset.litersPerUnit != null ? String(preset.litersPerUnit) : "",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="text-lg font-extrabold text-slate-900">Manage quick presets</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="px-5 py-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">
            {editingPresetId ? "Edit custom preset" : "Add custom preset"}
          </h3>
          <form onSubmit={handleSubmit} className="mt-3 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                placeholder="Preset name"
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              />
              <select
                value={form.activityType}
                onChange={(e) => setForm((f) => ({ ...f, activityType: e.target.value }))}
                className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value="">Select activity</option>
                {ACTIVITY_OPTIONS.filter(Boolean).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={form.inputMode}
                onChange={(e) => setForm((f) => ({ ...f, inputMode: e.target.value }))}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              >
                <option value={INPUT_MODES.DIRECT}>Direct liters</option>
                <option value={INPUT_MODES.DURATION}>Duration x flow rate</option>
                <option value={INPUT_MODES.COUNT}>Count x liters per unit</option>
              </select>
            </div>

            {form.inputMode === INPUT_MODES.DIRECT ? (
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.liters}
                onChange={(e) => setForm((f) => ({ ...f, liters: e.target.value }))}
                placeholder="Liters"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
              />
            ) : null}

            {form.inputMode === INPUT_MODES.DURATION ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  placeholder="Duration (minutes)"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.flowRateLpm}
                  onChange={(e) => setForm((f) => ({ ...f, flowRateLpm: e.target.value }))}
                  placeholder="Flow rate (L/min)"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
            ) : null}

            {form.inputMode === INPUT_MODES.COUNT ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.count}
                  onChange={(e) => setForm((f) => ({ ...f, count: e.target.value }))}
                  placeholder="Count"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.litersPerUnit}
                  onChange={(e) => setForm((f) => ({ ...f, litersPerUnit: e.target.value }))}
                  placeholder="Liters per unit"
                  className="h-10 rounded-xl border border-slate-200 px-3 text-sm"
                />
              </div>
            ) : null}

            {error ? <div className="text-xs font-semibold text-rose-700">{error}</div> : null}

            <div>
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm">
                  {editingPresetId ? "Save changes" : "Add preset"}
                </Button>
                {editingPresetId ? (
                  <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </div>
          </form>

          <div className="mt-6">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Your custom presets</h3>
            <div className="mt-3 space-y-2">
              {customPresets.length === 0 ? (
                <p className="text-sm text-slate-500">No custom presets yet.</p>
              ) : (
                customPresets.map((preset) => (
                  <div key={preset.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{preset.label}</div>
                      <div className="text-xs text-slate-500">
                        {preset.activityType} · ~{estimatePresetLiters(preset).toLocaleString()} L
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" size="sm" variant="ghost" onClick={() => editPreset(preset)}>
                        Edit
                      </Button>
                      <Button type="button" size="sm" variant="dark" onClick={() => onDeletePreset(preset.id)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WaterActivities() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [highUsageOnly, setHighUsageOnly] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(defaultForm());
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [quickSavingId, setQuickSavingId] = useState("");
  const [customPresets, setCustomPresets] = useState([]);
  const [presetManagerOpen, setPresetManagerOpen] = useState(false);
  const [weeklyGoalLiters, setWeeklyGoalLiters] = useState("700");
  const [weeklyGoalActivities, setWeeklyGoalActivities] = useState("20");

  useEffect(() => {
    if (!notice && !error) return;
    const t = setTimeout(() => {
      setNotice("");
      setError("");
    }, 3000);
    return () => clearTimeout(t);
  }, [notice, error]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setCustomPresets(parsed);
    } catch {
      setCustomPresets([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
  }, [customPresets]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEEKLY_GOALS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.liters != null) setWeeklyGoalLiters(String(parsed.liters));
      if (parsed?.activities != null) setWeeklyGoalActivities(String(parsed.activities));
    } catch {
      setWeeklyGoalLiters("700");
      setWeeklyGoalActivities("20");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      WEEKLY_GOALS_STORAGE_KEY,
      JSON.stringify({
        liters: Number(weeklyGoalLiters || 0),
        activities: Number(weeklyGoalActivities || 0),
      })
    );
  }, [weeklyGoalLiters, weeklyGoalActivities]);

  const allPresets = useMemo(() => [...QUICK_PRESETS, ...customPresets], [customPresets]);

  const filteredPresets = useMemo(() => {
    if (selectedCategory === "all") return allPresets;
    return allPresets.filter((preset) => getActivityCategory(preset.activityType) === selectedCategory);
  }, [allPresets, selectedCategory]);

  const filteredItems = useMemo(() => {
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    return items.filter((item) => {
      if (selectedCategory !== "all" && getActivityCategory(item.activityType) !== selectedCategory) {
        return false;
      }

      if (sourceFilter !== "all" && String(item.source || "manual") !== sourceFilter) {
        return false;
      }

      if (highUsageOnly && Number(item.liters || 0) < 50) {
        return false;
      }

      const occurredAt = new Date(item.occurredAt || "").getTime();
      if (!Number.isFinite(occurredAt)) return true;

      if (timeFilter === "today") return occurredAt >= dayAgo;
      if (timeFilter === "7d") return occurredAt >= sevenDaysAgo;
      return true;
    });
  }, [items, selectedCategory, sourceFilter, highUsageOnly, timeFilter]);

  const summary = useMemo(() => {
    const totalLiters = filteredItems.reduce((sum, item) => sum + Number(item.liters || 0), 0);
    const count = filteredItems.length;
    const avgLiters = count > 0 ? totalLiters / count : 0;
    const presetCount = filteredItems.filter((item) => String(item.source || "manual") === "preset").length;
    const presetShare = count > 0 ? (presetCount / count) * 100 : 0;

    return {
      totalLiters,
      count,
      avgLiters,
      presetShare,
    };
  }, [filteredItems]);

  const groupedFilteredItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      const aTime = new Date(a?.occurredAt || 0).getTime();
      const bTime = new Date(b?.occurredAt || 0).getTime();
      return bTime - aTime;
    });

    const groups = [];
    const map = new Map();

    sorted.forEach((item) => {
      const label = formatDateGroupLabel(item?.occurredAt || new Date().toISOString());
      if (!map.has(label)) {
        map.set(label, []);
        groups.push({ label, items: map.get(label) });
      }
      map.get(label).push(item);
    });

    return groups;
  }, [filteredItems]);

  const hasQuickFilters = timeFilter !== "all" || sourceFilter !== "all" || highUsageOnly;

  function clearQuickFilters() {
    setTimeFilter("all");
    setSourceFilter("all");
    setHighUsageOnly(false);
  }

  const weeklyStats = useMemo(() => {
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    const weekItems = items.filter((item) => {
      const time = new Date(item.occurredAt || "").getTime();
      return Number.isFinite(time) && time >= sevenDaysAgo;
    });

    const categoryWeekItems = selectedCategory === "all"
      ? weekItems
      : weekItems.filter((item) => getActivityCategory(item.activityType) === selectedCategory);

    const liters = categoryWeekItems.reduce((sum, item) => sum + Number(item.liters || 0), 0);
    const activities = categoryWeekItems.length;
    return { liters, activities };
  }, [items, selectedCategory]);

  const litersGoal = Math.max(0, Number(weeklyGoalLiters || 0));
  const activitiesGoal = Math.max(0, Number(weeklyGoalActivities || 0));
  const litersProgress = litersGoal > 0 ? Math.min(100, (weeklyStats.liters / litersGoal) * 100) : 0;
  const activitiesProgress = activitiesGoal > 0 ? Math.min(100, (weeklyStats.activities / activitiesGoal) * 100) : 0;

  function getGoalState(progress, goal) {
    if (goal <= 0) {
      return {
        label: "No goal",
        badgeClass: "bg-slate-100 text-slate-600",
        barClass: "bg-slate-400",
      };
    }

    if (progress >= 100) {
      return {
        label: "Over target",
        badgeClass: "bg-rose-100 text-rose-700",
        barClass: "bg-rose-500",
      };
    }

    if (progress >= 80) {
      return {
        label: "Near limit",
        badgeClass: "bg-amber-100 text-amber-700",
        barClass: "bg-amber-500",
      };
    }

    return {
      label: "On track",
      badgeClass: "bg-emerald-100 text-emerald-700",
      barClass: "bg-emerald-500",
    };
  }

  const litersState = getGoalState(litersProgress, litersGoal);
  const activitiesState = getGoalState(activitiesProgress, activitiesGoal);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await usageApi.list(token, { page: 1, limit: 8, sort: "-occurredAt" });
      setItems(Array.isArray(res?.data) ? res.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load recent activities");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  function openCreate() {
    setCreateOpen(true);
    setForm(defaultForm());
    setFormError("");
  }

  function closeCreate() {
    setCreateOpen(false);
    setFormError("");
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
      await usageApi.create(token, buildUsagePayload(form));
      setNotice("Water activity logged successfully.");
      closeCreate();
      await loadRecent();
    } catch (e2) {
      setFormError(e2?.message || "Failed to log activity");
    } finally {
      setSaving(false);
    }
  }

  async function quickAddPreset(preset) {
    setNotice("");
    setError("");
    setQuickSavingId(preset.id);
    try {
      await usageApi.create(token, buildPresetPayload(preset));
      setNotice(`Logged ${preset.label} (${estimatePresetLiters(preset).toLocaleString()} L).`);
      await loadRecent();
    } catch (e) {
      setError(e?.message || "Failed to log quick activity");
    } finally {
      setQuickSavingId("");
    }
  }

  async function repeatLastActivity() {
    setNotice("");
    setError("");
    setQuickSavingId("repeat-last");
    try {
      const res = await usageApi.list(token, { page: 1, limit: 1, sort: "-occurredAt" });
      const latest = Array.isArray(res?.data) ? res.data[0] : null;
      if (!latest) {
        setNotice("No previous activity found to repeat.");
        return;
      }

      const payload = {
        activityType: latest.activityType,
        source: "preset",
        occurredAt: new Date().toISOString(),
        notes: "Repeated last activity",
      };

      if (latest.durationMinutes != null && latest.flowRateLpm != null) {
        payload.durationMinutes = Number(latest.durationMinutes);
        payload.flowRateLpm = Number(latest.flowRateLpm);
      } else if (latest.count != null && latest.litersPerUnit != null) {
        payload.count = Number(latest.count);
        payload.litersPerUnit = Number(latest.litersPerUnit);
      } else {
        payload.liters = Number(latest.liters || 0);
      }

      await usageApi.create(token, payload);
      setNotice(`Repeated: ${latest.activityType}.`);
      await loadRecent();
    } catch (e) {
      setError(e?.message || "Failed to repeat last activity");
    } finally {
      setQuickSavingId("");
    }
  }

  function addCustomPreset(preset) {
    setCustomPresets((prev) => [preset, ...prev]);
    setNotice(`Custom preset "${preset.label}" added.`);
  }

  function updateCustomPreset(preset) {
    setCustomPresets((prev) => prev.map((p) => (p.id === preset.id ? preset : p)));
    setNotice(`Custom preset "${preset.label}" updated.`);
  }

  function deleteCustomPreset(id) {
    setCustomPresets((prev) => prev.filter((p) => p.id !== id));
    setNotice("Custom preset removed.");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Water activities</h1>
          <p className="mt-1 text-sm text-slate-600">
            Log activities quickly with presets or use advanced input for precise tracking.
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={() => setPresetManagerOpen(true)}>
            Manage presets
          </Button>
          <Button type="button" variant="ghost" onClick={repeatLastActivity} disabled={Boolean(quickSavingId)}>
            {quickSavingId === "repeat-last" ? "Repeating..." : "Repeat last activity"}
          </Button>
          <Button type="button" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add activity
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Total liters"
          value={`${summary.totalLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })} L`}
          helper="From visible activities"
          icon={Droplets}
          cardTone="from-sky-50 to-cyan-50 border-sky-100"
          iconTone="bg-sky-100 text-sky-700"
        />
        <SummaryMetric
          label="Activities"
          value={summary.count.toLocaleString()}
          helper="Current filtered list"
          icon={BarChart3}
          cardTone="from-emerald-50 to-lime-50 border-emerald-100"
          iconTone="bg-emerald-100 text-emerald-700"
        />
        <SummaryMetric
          label="Average"
          value={`${summary.avgLiters.toLocaleString(undefined, { maximumFractionDigits: 1 })} L`}
          helper="Per activity"
          icon={Filter}
          cardTone="from-amber-50 to-orange-50 border-amber-100"
          iconTone="bg-amber-100 text-amber-700"
        />
        <SummaryMetric
          label="Preset share"
          value={`${summary.presetShare.toFixed(0)}%`}
          helper="Preset-based entries"
          icon={Plus}
          cardTone="from-slate-50 to-zinc-100 border-slate-200"
          iconTone="bg-slate-200 text-slate-700"
        />
      </div>

      <Card className="mt-5 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Quick add presets</h2>
            <p className="mt-1 text-sm text-slate-600">One click logs common activities with estimated liters.</p>
          </div>
          <div className="text-xs text-slate-500">Source: preset</div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => {
            const active = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCategory(tab.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-brand-100 text-brand-900 ring-1 ring-brand-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPresets.map((preset) => (
            (() => {
              const visual = getPresetVisual(preset);
              const Icon = visual.icon;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => quickAddPreset(preset)}
                  disabled={Boolean(quickSavingId)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-brand-200 hover:bg-brand-50/30 disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{preset.label}</div>
                      <div className="mt-1 text-xs text-slate-500">{preset.activityType}</div>
                    </div>
                    <span className={`grid h-8 w-8 place-items-center rounded-xl ${visual.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                  </div>

                  <div className="mt-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    ~{estimatePresetLiters(preset).toLocaleString()} L
                  </div>

                  {quickSavingId === preset.id ? (
                    <div className="mt-2 text-xs font-semibold text-brand-700">Logging...</div>
                  ) : null}
                </button>
              );
            })()
          ))}
          {filteredPresets.length === 0 ? (
            <p className="text-sm text-slate-500">No presets available for this category yet.</p>
          ) : null}
        </div>
      </Card>

      {(notice || error) ? (
        <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[min(92vw,420px)] flex-col gap-2">
          {error ? (
            <div className="pointer-events-auto rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-100 shadow-lg">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="pointer-events-auto rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 shadow-lg">
              {notice}
            </div>
          ) : null}
        </div>
      ) : null}

      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Weekly goals</h2>
            <p className="mt-1 text-sm text-slate-600">
              Track last 7 days progress {selectedCategory !== "all" ? `for ${selectedCategory} activities` : "across all activities"}.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Liters goal
              <input
                type="number"
                min="0"
                value={weeklyGoalLiters}
                onChange={(e) => setWeeklyGoalLiters(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-800"
              />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Activities goal
              <input
                type="number"
                min="0"
                value={weeklyGoalActivities}
                onChange={(e) => setWeeklyGoalActivities(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-800"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Liters used</span>
              <div className="flex items-center gap-2">
                <span>{Math.round(litersProgress)}%</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${litersState.badgeClass}`}>
                  {litersState.label}
                </span>
              </div>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${litersState.barClass}`} style={{ width: `${litersProgress}%` }} />
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {weeklyStats.liters.toLocaleString(undefined, { maximumFractionDigits: 1 })} L / {litersGoal.toLocaleString()} L
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Activities logged</span>
              <div className="flex items-center gap-2">
                <span>{Math.round(activitiesProgress)}%</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${activitiesState.badgeClass}`}>
                  {activitiesState.label}
                </span>
              </div>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div className={`h-full rounded-full ${activitiesState.barClass}`} style={{ width: `${activitiesProgress}%` }} />
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-800">
              {weeklyStats.activities.toLocaleString()} / {activitiesGoal.toLocaleString()}
            </p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Recent logged activities</h2>
            <p className="mt-1 text-sm text-slate-600">Latest entries in the selected category confirm what was tracked.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
            >
              <option value="all">All sources</option>
              <option value="manual">Manual</option>
              <option value="preset">Preset</option>
              <option value="imported">Imported</option>
            </select>

            <button
              type="button"
              onClick={() => setHighUsageOnly((v) => !v)}
              className={`h-9 rounded-lg px-3 text-xs font-semibold transition ${
                highUsageOnly
                  ? "bg-brand-100 text-brand-900 ring-1 ring-brand-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              High usage only
            </button>

            <Button type="button" variant="ghost" className="gap-2" onClick={loadRecent}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {hasQuickFilters ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {timeFilter !== "all" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Time: {timeFilter === "today" ? "Today" : "Last 7 days"}
              </span>
            ) : null}
            {sourceFilter !== "all" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Source: {sourceFilter}
              </span>
            ) : null}
            {highUsageOnly ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-800">
                High usage only
              </span>
            ) : null}

            <button
              type="button"
              onClick={clearQuickFilters}
              className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100"
            >
              <X className="h-3 w-3" /> Clear quick filters
            </button>
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-slate-500">No activities match these filters. Try clearing quick filters or log a new activity.</p>
          ) : (
            groupedFilteredItems.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.label}</div>
                {group.items.map((item) => (
                  <div key={item._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.activityType || "-"}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getSourceTheme(item.source)}`}>
                          {String(item.source || "manual").toUpperCase()}
                        </span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {getActivityCategory(item.activityType).toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.occurredAt ? new Date(item.occurredAt).toLocaleString() : "-"}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-slate-700">
                      {Number(item.liters || 0).toLocaleString()} L
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Need deeper review, edits, and filters? Open <Link to="/user/usage" className="font-semibold text-brand-700 hover:underline">Usage History</Link>.
        </div>
      </Card>

      {createOpen ? (
        <UsageModal
          title="Add water activity"
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={submitForm}
          onClose={closeCreate}
          error={formError}
        />
      ) : null}

      <PresetManagerModal
        open={presetManagerOpen}
        onClose={() => setPresetManagerOpen(false)}
        customPresets={customPresets}
        onAddPreset={addCustomPreset}
        onUpdatePreset={updateCustomPreset}
        onDeletePreset={deleteCustomPreset}
      />

      <button
        type="button"
        onClick={openCreate}
        className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg ring-4 ring-brand-200/60 transition hover:bg-brand-700 md:hidden"
        aria-label="Add water activity"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
