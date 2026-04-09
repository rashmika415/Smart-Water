import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { SRI_LANKA_COUNTRY, SRI_LANKA_PROVINCES, SRI_LANKA_TOWNS } from "../../lib/sriLankaLocations";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

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
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">My households</h1>
          <p className="mt-1 text-sm text-slate-600">Create, view, edit, and delete your household records.</p>
        </div>
        <Button onClick={() => setCreateOpen((v) => !v)}>{createOpen ? "Close form" : "Create household"}</Button>
      </div>

      {createOpen ? (
        <Card className="mt-6 p-6">
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
                {SRI_LANKA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
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
                {SRI_LANKA_TOWNS.map((t) => (
                  <option key={t} value={t} />
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

      <div className="mt-6">
        <input className="h-11 w-full max-w-md rounded-xl border border-slate-200 px-4 text-sm" placeholder="Search households..." value={search} onChange={(e) => { setSearch(e.target.value); }} />
      </div>

      {error ? <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {loading ? <p className="mt-6 text-sm text-slate-500">Loading households...</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paged.map((h) => (
          <Card key={h._id} className="p-5">
            <div className="text-base font-extrabold text-slate-900">{h.name}</div>
            <div className="mt-1 text-sm text-slate-600">{h.location?.city || "Unknown city"} · {h.propertyType}</div>
            <div className="mt-2 text-sm text-slate-600">{h.numberOfResidents} residents</div>
            <div className="mt-2 text-sm text-slate-700">Predicted bill: <span className="font-semibold">{Number(h.predictedBill || 0).toFixed(2)}</span></div>
            <div className="mt-4 flex gap-2">
              <Button as={Link} to={`/user/households/${h._id}`} size="sm">View details</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => toggleZoneForm(h._id)}>
                {zoneForms[h._id]?.open ? "Close zone form" : "Create zone"}
              </Button>
              <Button as={Link} to={`/user/households/${h._id}`} variant="ghost" size="sm">Edit</Button>
              <Button type="button" variant="dark" size="sm" onClick={() => onDelete(h._id)}>Delete</Button>
            </div>
            {zoneForms[h._id]?.open ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="grid gap-2">
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
                  <div>
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
    </div>
  );
}
