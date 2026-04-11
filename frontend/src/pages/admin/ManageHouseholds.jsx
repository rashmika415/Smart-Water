import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { pdfEnsureSpace, pdfFooterLine, pdfHeaderBanner } from "../../lib/adminPdf";
import { Search, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Download, Home, Users, Receipt, CloudSun, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";

function SummaryMetric({ label, value, helper, icon: Icon, cardTone = "from-sky-50 to-cyan-50 border-sky-100", iconTone = "bg-sky-100 text-sky-700" }) {
  return (
    <Card className={`border bg-gradient-to-br p-4 ${cardTone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">{value}</div>
          {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

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

function buildHouseholdsPdfRows(list, searchNote) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toISOString().slice(0, 10);
  let y = pdfHeaderBanner(doc, {
    title: "Households report",
    subtitle: `Generated ${today}${searchNote ? ` · ${searchNote}` : ""} · ${list.length} record(s)`,
    left,
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("Name", left, y);
  doc.text("City", left + 130, y);
  doc.text("Res.", left + 220, y);
  doc.text("Type", left + 248, y);
  doc.text("Est. bill", left + 300, y);
  doc.text("Owner ID", left + 370, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(226, 232, 240);
  doc.line(left, y - 4, pageWidth - left, y - 4);
  y += 10;

  list.forEach((h) => {
    y = pdfEnsureSpace(doc, y, 20, left, pageWidth);
    doc.setFontSize(8);
    doc.text(String(h.name || "—").slice(0, 22), left, y);
    doc.text(String(h.location?.city || "—").slice(0, 16), left + 130, y);
    doc.text(String(h.numberOfResidents ?? "—"), left + 220, y);
    doc.text(String(h.propertyType || "—").slice(0, 10), left + 248, y);
    doc.text(h.predictedBill != null ? Number(h.predictedBill).toFixed(2) : "—", left + 300, y);
    doc.text(String(h.userId || "—").slice(0, 14), left + 370, y);
    y += 16;
  });

  pdfFooterLine(doc, left);
  doc.save(`admin-households-${today}.pdf`);
}

export function ManageHouseholds() {
  const { token } = useAuth();
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;
  const [data, setData] = useState({ total: 0, pages: 1, households: [] });
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
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

  const pageStats = useMemo(() => {
    const hh = data.households;
    let houses = 0;
    let apartments = 0;
    let billSum = 0;
    let resSum = 0;
    const climate = {};
    hh.forEach((h) => {
      if (String(h.propertyType).toLowerCase() === "apartment") apartments += 1;
      else houses += 1;
      billSum += Number(h.predictedBill) || 0;
      resSum += Number(h.numberOfResidents) || 0;
      const z = h.climateZone || "Unknown";
      climate[z] = (climate[z] || 0) + 1;
    });
    return {
      houses,
      apartments,
      billSum,
      resSum,
      climateRows: Object.entries(climate)
        .map(([name, count]) => ({ name: name.length > 12 ? `${name.slice(0, 11)}…` : name, count }))
        .sort((a, b) => b.count - a.count),
    };
  }, [data.households]);

  const propertyChartData = useMemo(
    () => [
      { name: "House", count: pageStats.houses },
      { name: "Apartment", count: pageStats.apartments },
    ],
    [pageStats.houses, pageStats.apartments]
  );

  async function onDownloadPdf() {
    const total = data.total || 0;
    if (total === 0) return;
    setPdfLoading(true);
    try {
      const lim = Math.min(total, 400);
      const res = await householdsApi.list(token, { page: 1, limit: lim, search: debounced });
      const list = res?.households ?? [];
      const searchNote = debounced.trim() ? `Search: "${debounced.trim()}"` : "";
      buildHouseholdsPdfRows(list, searchNote);
    } catch (e) {
      alert(e?.message || "Failed to build PDF");
    } finally {
      setPdfLoading(false);
    }
  }

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Manage households</h1>
          <p className="mt-1 text-sm text-slate-600">
            All households in the system — search, paginate, view, edit, delete.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" className="gap-2" onClick={onDownloadPdf} disabled={loading || pdfLoading || !data.total}>
            <Download className="h-4 w-4" />
            {pdfLoading ? "Preparing…" : "Download PDF"}
          </Button>
          <Button type="button" variant="ghost" className="gap-2" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Total households"
          value={String(data.total)}
          helper="Matching current search"
          icon={Home}
          cardTone="from-sky-50 to-cyan-50 border-sky-100"
          iconTone="bg-sky-100 text-sky-700"
        />
        <SummaryMetric
          label="On this page"
          value={String(data.households.length)}
          helper={`Page ${page} of ${data.pages || 1}`}
          icon={Receipt}
          cardTone="from-violet-50 to-indigo-50 border-violet-100"
          iconTone="bg-violet-100 text-violet-700"
        />
        <SummaryMetric
          label="Residents (page)"
          value={String(pageStats.resSum)}
          helper="Sum on visible rows"
          icon={Users}
          cardTone="from-emerald-50 to-teal-50 border-emerald-100"
          iconTone="bg-emerald-100 text-emerald-700"
        />
        <SummaryMetric
          label="Est. bill sum (page)"
          value={pageStats.billSum.toFixed(2)}
          helper="Predicted Rs. total"
          icon={CloudSun}
          cardTone="from-amber-50 to-orange-50 border-amber-100"
          iconTone="bg-amber-100 text-amber-700"
        />
      </div>

      {data.households.length > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Card className="border border-slate-200/80 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Property type (this page)</h2>
            <p className="mt-1 text-xs text-slate-500">House vs apartment count for visible rows.</p>
            <div className="mt-4 h-[220px] w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={propertyChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} households`, "Count"]} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Households" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="border border-slate-200/80 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Climate zone (this page)</h2>
            <p className="mt-1 text-xs text-slate-500">Distribution of climate labels on visible rows.</p>
            <div className="mt-4 h-[220px] w-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pageStats.climateRows} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${v}`, "Households"]} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by household name…"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none ring-brand-300 focus:ring-2"
          />
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      <Card className="mt-6 overflow-hidden border border-slate-200/80 p-0 shadow-sm">
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
