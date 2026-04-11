import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { SRI_LANKA_COUNTRY, SRI_LANKA_PROVINCES, SRI_LANKA_TOWNS } from "../../lib/sriLankaLocations";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Home, PlusCircle, Search, Trash2, MapPin, Users, DollarSign, Building2, Sparkles } from "lucide-react";

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
    zoneName: "",
    zoneNotes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await householdsApi.myHouseholds(token);
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
      if (form.zoneName.trim()) {
        await householdsApi.createZone(token, created._id, {
          zoneName: form.zoneName.trim(),
          notes: form.zoneNotes.trim() || undefined,
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
        zoneName: "",
        zoneNotes: "",
      });
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
        [householdId]: { open: false, zoneName: "", notes: "", saving: false },
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
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-violet-200/40 bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 p-7 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-100">Household Management</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">My Households</h1>
            <p className="mt-2 text-sm text-indigo-50/95">Create and manage households with zones, billing, and location details.</p>
          </div>
          <Button onClick={() => setCreateOpen((v) => !v)} className="bg-white text-indigo-700 hover:bg-indigo-50">
            <PlusCircle className="h-4 w-4" />
            {createOpen ? "Close form" : "Create household"}
          </Button>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-900">Manage Records</h2>
          <p className="mt-1 text-sm text-slate-600">Track all your homes, locations, and zones in one place.</p>
        </div>
        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="h-11 w-full rounded-xl border border-slate-200 px-10 text-sm" placeholder="Search households..." value={search} onChange={(e) => { setSearch(e.target.value); }} />
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visible Households</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{filtered.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Residents</p>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalResidents}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Combined Predicted Bill</p>
          <p className="mt-2 text-2xl font-black text-slate-900">Rs. {totalPredicted.toFixed(2)}</p>
        </Card>
      </section>

      {createOpen ? (
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-extrabold text-slate-900">Create Household</h3>
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-2">
            <input className="h-11 rounded-xl border border-slate-200 px-4 text-sm" placeholder="Household name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <input type="number" min={1} className="h-11 rounded-xl border border-slate-200 px-4 text-sm" placeholder="Number of residents" value={form.numberOfResidents} onChange={(e) => setForm((f) => ({ ...f, numberOfResidents: e.target.value }))} required />
            <select className="h-11 rounded-xl border border-slate-200 px-4 text-sm" value={form.propertyType} onChange={(e) => setForm((f) => ({ ...f, propertyType: e.target.value }))}>
              <option value="house">house</option>
              <option value="apartment">apartment</option>
            </select>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Province</label>
              <select
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
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
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm"
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
                className="h-11 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm"
                value={SRI_LANKA_COUNTRY}
                readOnly
              />
            </div>
            <input
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
              placeholder="First zone name (optional)"
              value={form.zoneName}
              onChange={(e) => setForm((f) => ({ ...f, zoneName: e.target.value }))}
            />
            <input
              className="h-11 rounded-xl border border-slate-200 px-4 text-sm"
              placeholder="First zone notes (optional)"
              value={form.zoneNotes}
              onChange={(e) => setForm((f) => ({ ...f, zoneNotes: e.target.value }))}
            />
            <div className="md:col-span-2 text-xs text-slate-500">
              Optional: add the first zone now so household and zone are created together.
            </div>
            <div className="md:col-span-2">
              <Button type="submit">Save household</Button>
            </div>
          </form>
        </Card>
      ) : null}

      {error ? <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <p className="mt-6 text-sm text-slate-500">Loading households...</p> : null}

      <div className="space-y-4">
        {paged.map((h) => (
          <Card key={h._id} className="overflow-hidden p-0">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
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
            <div className="px-6 py-5">
              <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
                <Home className="h-3.5 w-3.5 text-brand-600" />
                Climate zone: {h.climateZone || "Unknown"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button as={Link} to={`/user/households/${h._id}`} size="sm">View details</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleZoneForm(h._id)}>
                {zoneForms[h._id]?.open ? "Close zone form" : "Create zone"}
              </Button>
              <Button as={Link} to={`/user/households/${h._id}`} variant="ghost" size="sm">Edit</Button>
              <Button type="button" variant="dark" size="sm" onClick={() => onDelete(h._id)} className="gap-1"><Trash2 className="h-3.5 w-3.5" />Delete</Button>
              </div>
            </div>
            {zoneForms[h._id]?.open ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    placeholder="Zone name (Kitchen, Bathroom...)"
                    value={zoneForms[h._id]?.zoneName || ""}
                    onChange={(e) =>
                      setZoneForms((prev) => ({
                        ...prev,
                        [h._id]: { ...prev[h._id], zoneName: e.target.value },
                      }))
                    }
                  />
                  <input
                    className="h-10 rounded-lg border border-slate-200 px-3 text-sm"
                    placeholder="Notes (optional)"
                    value={zoneForms[h._id]?.notes || ""}
                    onChange={(e) =>
                      setZoneForms((prev) => ({
                        ...prev,
                        [h._id]: { ...prev[h._id], notes: e.target.value },
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
                      {zoneForms[h._id]?.saving ? "Creating..." : "Create zone"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
      {!loading && paged.length === 0 ? (
        <Card className="border border-brand-100 bg-gradient-to-r from-brand-50/80 to-cyan-50/80 p-6">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white ring-1 ring-brand-100">
              <Sparkles className="h-5 w-5 text-brand-700" />
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
