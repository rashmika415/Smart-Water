import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi, zonesApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

export function HouseholdDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const [household, setHousehold] = useState(null);
  const [zones, setZones] = useState([]);
  const [error, setError] = useState("");
  const [zoneForm, setZoneForm] = useState({ zoneName: "", notes: "" });
  const [editForm, setEditForm] = useState({ name: "", numberOfResidents: 1, propertyType: "house", city: "", state: "", country: "" });

  const load = useCallback(async () => {
    setError("");
    try {
      const [h, z] = await Promise.all([householdsApi.getById(token, id), householdsApi.zones(token, id)]);
      setHousehold(h);
      setZones(Array.isArray(z) ? z : []);
      setEditForm({
        name: h.name || "",
        numberOfResidents: h.numberOfResidents || 1,
        propertyType: h.propertyType || "house",
        city: h.location?.city || "",
        state: h.location?.state || "",
        country: h.location?.country || "",
      });
    } catch (err) {
      setError(err?.message || "Failed to load household details");
    }
  }, [id, token]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveHousehold(e) {
    e.preventDefault();
    try {
      await householdsApi.update(token, id, {
        name: editForm.name,
        numberOfResidents: Number(editForm.numberOfResidents),
        propertyType: editForm.propertyType,
        location: { city: editForm.city, state: editForm.state || undefined, country: editForm.country || undefined },
      });
      await load();
    } catch (err) {
      setError(err?.message || "Failed to update household");
    }
  }

  async function addZone(e) {
    e.preventDefault();
    try {
      await householdsApi.createZone(token, id, { zoneName: zoneForm.zoneName, notes: zoneForm.notes });
      setZoneForm({ zoneName: "", notes: "" });
      await load();
    } catch (err) {
      setError(err?.message || "Failed to add zone");
    }
  }

  async function updateZone(zone) {
    const zoneName = window.prompt("Zone name", zone.zoneName);
    if (!zoneName) return;
    const notes = window.prompt("Zone notes", zone.notes || "") || "";
    try {
      await zonesApi.update(token, zone._id, { zoneName, notes });
      await load();
    } catch (err) {
      setError(err?.message || "Failed to update zone");
    }
  }

  async function deleteZone(zoneId) {
    if (!window.confirm("Delete this zone?")) return;
    try {
      await zonesApi.delete(token, zoneId);
      await load();
    } catch (err) {
      setError(err?.message || "Failed to delete zone");
    }
  }

  if (!household) return <p className="text-sm text-slate-600">Loading household...</p>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">Household details</h1>
      {error ? <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card className="p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Overview</h2>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div><span className="font-semibold text-slate-700">Name:</span> {household.name}</div>
          <div><span className="font-semibold text-slate-700">Location:</span> {household.location?.city}{household.location?.state ? `, ${household.location.state}` : ""}{household.location?.country ? `, ${household.location.country}` : ""}</div>
          <div><span className="font-semibold text-slate-700">Property type:</span> {household.propertyType}</div>
          <div><span className="font-semibold text-slate-700">Residents:</span> {household.numberOfResidents}</div>
          <div><span className="font-semibold text-slate-700">Estimated liters:</span> {Number(household.estimatedMonthlyLiters || 0).toLocaleString()}</div>
          <div><span className="font-semibold text-slate-700">Estimated units:</span> {Number(household.estimatedMonthlyUnits || 0).toFixed(2)}</div>
          <div><span className="font-semibold text-slate-700">Climate zone:</span> {household.climateZone || "Unknown"}</div>
          <div><span className="font-semibold text-slate-700">Predicted bill:</span> {Number(household.predictedBill || 0).toFixed(2)}</div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Edit household</h2>
        <form onSubmit={saveHousehold} className="mt-4 grid gap-3 md:grid-cols-2">
          <input className="h-11 rounded-xl border border-slate-200 px-4 text-sm" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} required />
          <input type="number" min={1} className="h-11 rounded-xl border border-slate-200 px-4 text-sm" value={editForm.numberOfResidents} onChange={(e) => setEditForm((f) => ({ ...f, numberOfResidents: e.target.value }))} required />
          <select className="h-11 rounded-xl border border-slate-200 px-4 text-sm" value={editForm.propertyType} onChange={(e) => setEditForm((f) => ({ ...f, propertyType: e.target.value }))}>
            <option value="house">house</option>
            <option value="apartment">apartment</option>
          </select>
          <input className="h-11 rounded-xl border border-slate-200 px-4 text-sm" placeholder="City" value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} required />
          <input className="h-11 rounded-xl border border-slate-200 px-4 text-sm" placeholder="State" value={editForm.state} onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))} />
          <input className="h-11 rounded-xl border border-slate-200 px-4 text-sm" placeholder="Country" value={editForm.country} onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))} />
          <div className="md:col-span-2"><Button type="submit">Save household updates</Button></div>
        </form>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-extrabold text-slate-900">Zone management</h2>
        <form onSubmit={addZone} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className="h-11 rounded-xl border border-slate-200 px-4 text-sm" placeholder="Zone name (Kitchen, Bathroom...)" value={zoneForm.zoneName} onChange={(e) => setZoneForm((f) => ({ ...f, zoneName: e.target.value }))} required />
          <input className="h-11 rounded-xl border border-slate-200 px-4 text-sm" placeholder="Notes (optional)" value={zoneForm.notes} onChange={(e) => setZoneForm((f) => ({ ...f, notes: e.target.value }))} />
          <div className="sm:col-span-2"><Button type="submit">Add zone</Button></div>
        </form>

        <div className="mt-4 space-y-2">
          {zones.length === 0 ? <p className="text-sm text-slate-500">No zones yet.</p> : null}
          {zones.map((z) => (
            <div key={z._id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <div>
                <div className="font-semibold text-slate-800">{z.zoneName}</div>
                <div className="text-slate-600">{z.notes || "No notes"}</div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => updateZone(z)}>Edit</Button>
                <Button type="button" variant="dark" size="sm" onClick={() => deleteZone(z._id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
