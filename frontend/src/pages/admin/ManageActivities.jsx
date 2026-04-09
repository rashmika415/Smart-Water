import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { activitiesApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Search, Pencil, Trash2, Eye, Plus, Calendar, MapPin, User, Clock, CheckCircle2, Timer, AlertCircle } from "lucide-react";
import clsx from "clsx";

function Modal({ title, children, onClose }) {
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
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

const STATUS_THEMES = {
  Pending: { bg: "bg-amber-50", text: "text-amber-700", border: "ring-amber-100", icon: Timer },
  "In-Progress": { bg: "bg-sky-50", text: "text-sky-700", border: "ring-sky-100", icon: AlertCircle },
  Completed: { bg: "bg-emerald-50", text: "text-emerald-700", border: "ring-emerald-100", icon: CheckCircle2 },
};

export function ManageActivities() {
  const { token } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [viewActivity, setViewActivity] = useState(null);
  const [editActivity, setEditActivity] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    activityType: "",
    scheduledDate: new Date().toISOString().split('T')[0],
    scheduledTime: "",
    location: "",
    assignedStaff: "",
    staffEmail: "",
    notes: "",
    status: "Pending",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const resp = await activitiesApi.list(token);
      setActivities(resp?.success ? resp.data : []);
    } catch (e) {
      setError(e?.message || "Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activities;
    return activities.filter((a) => {
      return (
        a.activityType.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.assignedStaff.toLowerCase().includes(q)
      );
    });
  }, [activities, query]);

  async function handleDelete(a) {
    if (!window.confirm(`Delete activity "${a.activityType}"? This will notify the staff.`)) return;
    try {
      await activitiesApi.delete(token, a._id);
      await load();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  }

  function openEdit(a) {
    setEditActivity(a);
    setForm({
      activityType: a.activityType,
      scheduledDate: a.scheduledDate,
      scheduledTime: a.scheduledTime,
      location: a.location,
      assignedStaff: a.assignedStaff,
      staffEmail: a.staffEmail,
      notes: a.notes || "",
      status: a.status,
    });
    setIsCreating(false);
  }

  function openCreate() {
    setEditActivity(null);
    setForm({
      activityType: "",
      scheduledDate: new Date().toISOString().split('T')[0],
      scheduledTime: "",
      location: "",
      assignedStaff: "",
      staffEmail: "",
      notes: "",
      status: "Pending",
    });
    setIsCreating(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isCreating) {
        await activitiesApi.create(token, form);
      } else {
        await activitiesApi.update(token, editActivity._id, form);
      }
      setIsCreating(false);
      setEditActivity(null);
      await load();
    } catch (err) {
      alert(err?.message || "Operation failed");
    } finally {
      setSaving(false);
    }
  }

  const ActivityForm = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Activity Type</label>
          <input
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            value={form.activityType}
            onChange={(e) => setForm((f) => ({ ...f, activityType: e.target.value }))}
            placeholder="e.g. Pipe Leak Repair, Pump Maintenance"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Scheduled Date</label>
          <input
            type="date"
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            value={form.scheduledDate}
            onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Scheduled Time</label>
          <input
            type="time"
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            value={form.scheduledTime}
            onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
            required
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Location / Zone</label>
          <input
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Zone A - Garden Main Line"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Assigned Staff Name</label>
          <input
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            value={form.assignedStaff}
            onChange={(e) => setForm((f) => ({ ...f, assignedStaff: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Staff Email (for notifications)</label>
          <input
            type="email"
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            value={form.staffEmail}
            onChange={(e) => setForm((f) => ({ ...f, staffEmail: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">Status</label>
          <select
            className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="Pending">Pending</option>
            <option value="In-Progress">In-Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-semibold text-slate-700">Additional Notes</label>
          <textarea
            className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm"
            rows={3}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Description of the task or required parts…"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <Button type="button" variant="ghost" onClick={() => { setIsCreating(false); setEditActivity(null); }}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : isCreating ? "Create Activity" : "Save Changes"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="mx-auto max-w-6xl pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Maintenance Activities</h1>
          <p className="mt-1 text-sm text-slate-600">Schedule and manage water infrastructure tasks.</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Schedule Activity
        </Button>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by activity, location, or staff…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none ring-brand-300 focus:ring-2 shadow-sm"
          />
        </div>
        <Button type="button" variant="ghost" onClick={load}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100 italic">
          {error}
        </div>
      ) : null}

      <Card className="mt-6 overflow-hidden p-0 border-none shadow-md ring-1 ring-slate-200/60">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-4">Activity & Location</th>
                <th className="px-5 py-4">Schedule</th>
                <th className="px-5 py-4">Assigned To</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                        <span className="text-slate-400 font-medium tracking-tight">Loading activities…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center text-slate-400 font-medium">
                    No matching activities found.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => {
                  const theme = STATUS_THEMES[a.status] || STATUS_THEMES.Pending;
                  const Icon = theme.icon;
                  return (
                    <tr key={a._id} className="group transition-colors hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-brand-700 transition-colors uppercase text-xs tracking-tight">{a.activityType}</div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {a.location}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Calendar className="h-3.5 w-3.5 text-brand-500" />
                          {a.scheduledDate}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {a.scheduledTime}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                            {a.assignedStaff.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{a.assignedStaff}</div>
                            <div className="text-[10px] lowercase text-slate-400 font-medium">{a.staffEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className={clsx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1", theme.bg, theme.text, theme.border)}>
                          <Icon className="h-3 w-3" />
                          {a.status}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                          <button
                            type="button"
                            onClick={() => setViewActivity(a)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-brand-600 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-200 transition-all"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-slate-900 hover:shadow-sm ring-1 ring-transparent hover:ring-slate-200 transition-all"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(a)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm ring-1 ring-transparent hover:ring-rose-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {viewActivity ? (
        <Modal title="Activity Details" onClose={() => setViewActivity(null)}>
          <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{viewActivity.activityType}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 font-medium">
                        <MapPin className="h-4 w-4 text-brand-500" />
                        {viewActivity.location}
                    </div>
                </div>
                <div className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ring-1", STATUS_THEMES[viewActivity.status].bg, STATUS_THEMES[viewActivity.status].text, STATUS_THEMES[viewActivity.status].border)}>
                    {viewActivity.status}
                </div>
            </div>

            <div className="grid gap-4 rounded-2xl bg-slate-50/80 p-5 ring-1 ring-slate-200/50">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Date</div>
                        <div className="mt-1 text-sm font-bold text-slate-900">{viewActivity.scheduledDate}</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Time</div>
                        <div className="mt-1 text-sm font-bold text-slate-900">{viewActivity.scheduledTime}</div>
                    </div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Assigned Personnel</div>
                    <div className="mt-1 flex items-center gap-2">
                         <div className="h-6 w-6 rounded-full bg-brand-100 text-[10px] font-bold text-brand-700 grid place-items-center ring-1 ring-brand-200">{viewActivity.assignedStaff.charAt(0)}</div>
                         <div className="text-sm font-bold text-slate-900">{viewActivity.assignedStaff}</div>
                         <div className="text-xs text-slate-500 font-medium italic">({viewActivity.staffEmail})</div>
                    </div>
                </div>
            </div>

            {viewActivity.notes && (
                <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Internal Notes</div>
                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-600 leading-relaxed bg-white">
                        {viewActivity.notes}
                    </div>
                </div>
            )}

            <div className="text-[10px] text-slate-400 font-medium text-center pt-2">
                Created on {new Date(viewActivity.createdAt).toLocaleString()} • Last updated {new Date(viewActivity.updatedAt).toLocaleString()}
            </div>
          </div>
        </Modal>
      ) : null}

      {(isCreating || editActivity) ? (
        <Modal title={isCreating ? "Schedule New Activity" : "Edit Activity"} onClose={() => { setIsCreating(false); setEditActivity(null); }}>
          {ActivityForm}
        </Modal>
      ) : null}
    </div>
  );
}
