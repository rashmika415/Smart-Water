import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
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

export function ManageHouseholds() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;
  const [data, setData] = useState({ total: 0, pages: 1, households: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({
    name: "",
    numberOfResidents: 1,
    propertyType: "house",
    city: "",
    state: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const res = await householdsApi.list(token, { page, limit, search: debounced });
      setData({
        total: res?.total ?? 0,
        pages: res?.pages ?? 1,
        households: res?.households ?? [],
      });
    } catch (e) {
      setError(e?.message || "Failed to load households");
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(h) {
    setEdit(h);
    setForm({
      name: h.name || "",
      numberOfResidents: h.numberOfResidents || 1,
      propertyType: h.propertyType || "house",
      city: h.location?.city || "",
      state: h.location?.state || "",
      country: h.location?.country || "",
    });
  }

  async function submit(e) {
    e.preventDefault();
    if (!edit) return;
    setSaving(true);
    try {
      await householdsApi.update(token, edit._id, {
        name: form.name,
        numberOfResidents: Number(form.numberOfResidents),
        propertyType: form.propertyType,
        location: {
          city: form.city,
          state: form.state || undefined,
          country: form.country || undefined,
        },
      });
      setEdit(null);
      await load();
    } catch (err) {
      alert(err?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(h) {
    if (!window.confirm(`Delete household “${h.name}” and its zones?`)) return;
    try {
      await householdsApi.delete(token, h._id);
      await load();
    } catch (e) {
      alert(e?.message || "Delete failed");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">Manage households</h1>
      <p className="mt-1 text-sm text-slate-600">
        All households in the system — search, paginate, view, edit, delete.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by household name…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none ring-brand-300 focus:ring-2"
          />
        </div>
        <Button type="button" variant="ghost" onClick={load}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Residents</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Est. bill</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              ) : data.households.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    No households found.
                  </td>
                </tr>
              ) : (
                data.households.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-900">{h.name}</td>
                    <td className="px-4 py-3 text-slate-600">{h.location?.city || "—"}</td>
                    <td className="px-4 py-3">{h.numberOfResidents}</td>
                    <td className="px-4 py-3 capitalize">{h.propertyType}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{String(h.userId)}</td>
                    <td className="px-4 py-3">
                      {h.predictedBill != null ? Number(h.predictedBill).toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => setView(h)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(h)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(h)}
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
          Page {page} of {data.pages || 1} · {data.total} total
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
            disabled={page >= (data.pages || 1) || loading}
            onClick={() => setPage((p) => p + 1)}
            className="gap-1"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view ? (
        <Modal title="Household details" onClose={() => setView(null)}>
          <pre className="max-h-[60vh] overflow-auto rounded-xl bg-slate-50 p-3 text-xs text-slate-800">
            {JSON.stringify(view, null, 2)}
          </pre>
        </Modal>
      ) : null}

      {edit ? (
        <Modal title="Edit household" onClose={() => setEdit(null)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">Name</label>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Residents</label>
                <input
                  type="number"
                  min={1}
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={form.numberOfResidents}
                  onChange={(e) => setForm((f) => ({ ...f, numberOfResidents: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Property type</label>
                <select
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={form.propertyType}
                  onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))}
                >
                  <option value="house">house</option>
                  <option value="apartment">apartment</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">City</label>
              <input
                className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">State</label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={form.state}
                  onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Country</label>
                <input
                  className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                  value={form.country}
                  onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Saving recalculates estimates and predicted bill on the server.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEdit(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
