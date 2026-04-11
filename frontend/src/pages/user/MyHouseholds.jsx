import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { SRI_LANKA_COUNTRY, SRI_LANKA_PROVINCES, SRI_LANKA_TOWNS } from "../../lib/sriLankaLocations";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Home, PlusCircle, Search, Trash2, MapPin, Users, DollarSign, Building2, Sparkles, Layers, Plus, X } from "lucide-react";

function newZoneDraftRow() {
  return { key: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, zoneName: "", notes: "" };
}

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

export function MyHouseholds() {
  const { token } = useAuth();
  const [allItems, setAllItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [zoneForms, setZoneForms] = useState({});
  const [form, setForm] = useState({
    name: "",
    numberOfResidents: 1,
    propertyType: "house",
    city: "",
    state: "",
    country: SRI_LANKA_COUNTRY,
  });
  const [createZoneRows, setCreateZoneRows] = useState([newZoneDraftRow()]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await householdsApi.myWithZones(token);
      setAllItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load households");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((h) => (h.name || "").toLowerCase().includes(q));
  }, [allItems, search]);

  const paged = filtered;
  const totalResidents = useMemo(
    () => filtered.reduce((sum, h) => sum + Number(h.numberOfResidents || 0), 0),
    [filtered]
  );
  const totalPredicted = useMemo(
    () => filtered.reduce((sum, h) => sum + Number(h.predictedBill || 0), 0),
    [filtered]
  );

  async function onCreate(e) {
    e.preventDefault();
    try {
      const created = await householdsApi.create(token, {
        name: form.name,
        numberOfResidents: Number(form.numberOfResidents),
        propertyType: form.propertyType,
        location: {
          city: form.city,
          state: form.state || undefined,
          country: SRI_LANKA_COUNTRY,
        },
      });
      for (const row of createZoneRows) {
        const name = row.zoneName?.trim();
        if (!name) continue;
        await householdsApi.createZone(token, created._id, {
          zoneName: name,
          notes: row.notes?.trim() || undefined,
        });
      }
      setCreateOpen(false);
      setForm({
        name: "",
        numberOfResidents: 1,
        propertyType: "house",
        city: "",
        state: "",
        country: SRI_LANKA_COUNTRY,
      });
      setCreateZoneRows([newZoneDraftRow()]);
      await load();
    } catch (err) {
      setError(err?.message || "Failed to create household");
    }
  }

  function toggleZoneForm(householdId) {
    setZoneForms((prev) => {
      const existing = prev[householdId];
      if (existing?.open) {
        return {
          ...prev,
          [householdId]: { ...existing, open: false },
        };
      }
      return {
        ...prev,
        [householdId]: {
          open: true,
          zoneName: existing?.zoneName || "",
          notes: existing?.notes || "",
          saving: false,
          message: "",
        },
      };
    });
  }

  async function onCreateZone(householdId) {
    const zone = zoneForms[householdId];
    if (!zone?.zoneName?.trim()) {
      setError("Zone name is required.");
      return;
    }
    setZoneForms((prev) => ({
      ...prev,
      [householdId]: { ...prev[householdId], saving: true },
    }));
    try {
      await householdsApi.createZone(token, householdId, {
        zoneName: zone.zoneName.trim(),
        notes: zone.notes?.trim() || undefined,
      });
      setZoneForms((prev) => ({
        ...prev,
        [householdId]: {
          open: true,
          zoneName: "",
          notes: "",
          saving: false,
          message: "Zone saved. You can add another below.",
        },
      }));
      await load();
    } catch (err) {
      setError(err?.message || "Failed to add zone");
      setZoneForms((prev) => ({
        ...prev,
        [householdId]: { ...prev[householdId], saving: false },
      }));
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this household and all related zones?")) return;
    try {
      await householdsApi.delete(token, id);
      await load();
    } catch (err) {
      setError(err?.message || "Failed to delete household");
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">My households</h1>
          <p className="mt-1 text-sm text-slate-600">Create and manage households, zones, billing, and location details.</p>
        </div>
        <Button type="button" className="gap-2" onClick={() => setCreateOpen((v) => !v)}>
          <PlusCircle className="h-4 w-4" />
          {createOpen ? "Close form" : "Create household"}
        </Button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Manage records</h2>
          <p className="mt-1 text-sm text-slate-600">Search and review all homes in one place.</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="h-10 w-full rounded-xl border border-slate-200 px-10 text-sm" placeholder="Search households..." value={search} onChange={(e) => { setSearch(e.target.value); }} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryMetric
          label="Visible households"
          value={String(filtered.length)}
          helper="After search filter"
          icon={Home}
          cardTone="from-sky-50 to-cyan-50 border-sky-100"
          iconTone="bg-sky-100 text-sky-700"
        />
        <SummaryMetric
          label="Total residents"
          value={String(totalResidents)}
          helper="Across visible homes"
          icon={Users}
          cardTone="from-emerald-50 to-lime-50 border-emerald-100"
          iconTone="bg-emerald-100 text-emerald-700"
        />
        <SummaryMetric
          label="Combined predicted bill"
          value={`Rs. ${totalPredicted.toFixed(2)}`}
          helper="Estimated monthly total"
          icon={DollarSign}
          cardTone="from-amber-50 to-orange-50 border-amber-100"
          iconTone="bg-amber-100 text-amber-700"
        />
      </div>

      {createOpen ? (
        <Card className="mt-6 border border-slate-200/80 p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-extrabold uppercase tracking-wide text-slate-700">Create household</h3>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
            <input className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Household name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <input type="number" min={1} className="h-10 rounded-xl border border-slate-200 px-3 text-sm" placeholder="Number of residents" value={form.numberOfResidents} onChange={(e) => setForm((f) => ({ ...f, numberOfResidents: e.target.value }))} required />
            <select className="h-10 rounded-xl border border-slate-200 px-3 text-sm" value={form.propertyType} onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))}>
              <option value="house">house</option>
              <option value="apartment">apartment</option>
            </select>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Province</label>
              <select
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                required
              >
                <option value="">Select province</option>
                {SRI_LANKA_PROVINCES.map((p, idx) => (
                  <option key={`${p}-${idx}`} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Town / City</label>
              <input
                list="lk-towns"
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                placeholder="Start typing to search..."
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                required
              />
              <datalist id="lk-towns">
                {SRI_LANKA_TOWNS.map((t, idx) => (
                  <option key={`${t}-${idx}`} value={t} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
              <input
                className="h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm"
                value={SRI_LANKA_COUNTRY}
                readOnly
              />
            </div>
            <div className="md:col-span-2 space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-600">Zones (optional)</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 gap-1 text-xs"
                  onClick={() => setCreateZoneRows((rows) => [...rows, newZoneDraftRow()])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add zone row
                </Button>
              </div>
              <p className="text-xs text-slate-500">Add one or more zones now, or skip and add them later from this list.</p>
              {createZoneRows.map((row, idx) => (
                <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <input
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    placeholder={`Zone name (e.g. Kitchen ${idx + 1})`}
                    value={row.zoneName}
                    onChange={(e) =>
                      setCreateZoneRows((rows) =>
                        rows.map((r) => (r.key === row.key ? { ...r, zoneName: e.target.value } : r))
                      )
                    }
                  />
                  <input
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    placeholder="Notes (optional)"
                    value={row.notes}
                    onChange={(e) =>
                      setCreateZoneRows((rows) =>
                        rows.map((r) => (r.key === row.key ? { ...r, notes: e.target.value } : r))
                      )
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10 shrink-0 px-2"
                    disabled={createZoneRows.length <= 1}
                    onClick={() =>
                      setCreateZoneRows((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.key !== row.key)))
                    }
                    aria-label="Remove zone row"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Save household</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {error ? <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">{error}</div> : null}
      {loading ? <p className="mt-6 text-sm text-slate-500">Loading households...</p> : null}

      <div className="mt-6 space-y-4">
        {paged.map((h) => (
          <Card key={h._id} className="overflow-hidden border border-slate-200/80 p-0 shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-br from-sky-50/60 via-white to-cyan-50/40 px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-lg font-extrabold text-slate-900">{h.name}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{h.location?.city || "Unknown city"}</span>
                    <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{h.numberOfResidents} residents</span>
                    <span className="inline-flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{Number(h.predictedBill || 0).toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                      <Building2 className="h-3.5 w-3.5" />
                      {h.location?.state || "Province not set"}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">
                      <MapPin className="h-3.5 w-3.5" />
                      {h.location?.country || "Sri Lanka"}
                    </span>
                  </div>
                </div>
                <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                  {h.propertyType}
                </div>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
                <Home className="h-3.5 w-3.5 text-brand-600" />
                Climate zone: {h.climateZone || "Unknown"}
              </div>
              {Array.isArray(h.zones) && h.zones.filter(Boolean).length > 0 ? (
                <div className="mb-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Zones ({h.zones.filter(Boolean).length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {h.zones.filter(Boolean).map((z) => (
                      <span
                        key={z._id}
                        className="inline-flex max-w-full items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-900 ring-1 ring-teal-100"
                        title={z.notes || undefined}
                      >
                        <Layers className="h-3.5 w-3.5 shrink-0 text-teal-700" />
                        <span className="truncate">{z.zoneName}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mb-3 text-xs text-slate-500">No zones yet — use Add zone to create one or more.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button as={Link} to={`/user/households/${h._id}`} size="sm">View details</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleZoneForm(h._id)}>
                {zoneForms[h._id]?.open ? "Close add zone" : "Add zone"}
              </Button>
              <Button as={Link} to={`/user/households/${h._id}`} variant="ghost" size="sm">Edit</Button>
              <Button type="button" variant="dark" size="sm" onClick={() => onDelete(h._id)} className="gap-1"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
              </div>
            </div>
            {zoneForms[h._id]?.open ? (
              <div className="border-t border-slate-100 bg-slate-50/90 px-5 py-4">
                <p className="mb-2 text-xs font-semibold text-slate-600">Add a zone — save as many as you need, one at a time.</p>
                {zoneForms[h._id]?.message ? (
                  <p className="mb-2 text-xs font-medium text-emerald-700">{zoneForms[h._id].message}</p>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    placeholder="Zone name (Kitchen, Bathroom...)"
                    value={zoneForms[h._id]?.zoneName || ""}
                    onChange={(e) =>
                      setZoneForms((prev) => ({
                        ...prev,
                        [h._id]: { ...prev[h._id], zoneName: e.target.value, message: "" },
                      }))
                    }
                  />
                  <input
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                    placeholder="Notes (optional)"
                    value={zoneForms[h._id]?.notes || ""}
                    onChange={(e) =>
                      setZoneForms((prev) => ({
                        ...prev,
                        [h._id]: { ...prev[h._id], notes: e.target.value, message: "" },
                      }))
                    }
                  />
                  <div className="sm:col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => onCreateZone(h._id)}
                      disabled={Boolean(zoneForms[h._id]?.saving)}
                    >
                      {zoneForms[h._id]?.saving ? "Saving..." : "Save zone"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
      {!loading && paged.length === 0 ? (
        <Card className="border border-sky-100 bg-gradient-to-br from-sky-50/90 to-cyan-50/50 p-5 ring-1 ring-sky-100/80">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sky-700 ring-1 ring-sky-100">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">No households match this search</p>
              <p className="mt-1 text-sm text-slate-700">Try another name or create a new household to start tracking bills and zones.</p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
