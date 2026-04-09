import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { usageApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Plus, RefreshCw } from "lucide-react";

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
    if (selectedCategory === "all") return items;
    return items.filter((item) => getActivityCategory(item.activityType) === selectedCategory);
  }, [items, selectedCategory]);

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
            <button
              key={preset.id}
              type="button"
              onClick={() => quickAddPreset(preset)}
              disabled={Boolean(quickSavingId)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-brand-200 hover:bg-brand-50/30 disabled:opacity-60"
            >
              <div className="text-sm font-semibold text-slate-900">{preset.label}</div>
              <div className="mt-1 text-xs text-slate-500">
                {preset.activityType} · ~{estimatePresetLiters(preset).toLocaleString()} L
              </div>
              {quickSavingId === preset.id ? (
                <div className="mt-1 text-xs font-semibold text-brand-700">Logging...</div>
              ) : null}
            </button>
          ))}
          {filteredPresets.length === 0 ? (
            <p className="text-sm text-slate-500">No presets available for this category yet.</p>
          ) : null}
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
          <Button type="button" variant="ghost" className="gap-2" onClick={loadRecent}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {loading ? (
            <p className="text-sm text-slate-500">Loading recent activities...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-slate-500">No activities found for this category yet.</p>
          ) : (
            filteredItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.activityType || "-"}</div>
                  <div className="text-xs text-slate-500 capitalize">
                    {item.source || "manual"} · {item.occurredAt ? new Date(item.occurredAt).toLocaleString() : "-"}
                  </div>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  {Number(item.liters || 0).toLocaleString()} L
                </div>
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
    </div>
  );
}
