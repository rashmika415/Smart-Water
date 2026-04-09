import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";

function zoneMessage(zone) {
  const z = String(zone || "").toLowerCase();
  if (z.includes("dry")) return "Dry zone: higher estimated bill can happen due to increased water demand.";
  if (z.includes("wet")) return "Wet zone: estimated bill can be lower due to climate adjustment.";
  return "Intermediate zone: water demand is estimated with a neutral climate factor.";
}

export function WeatherInsights() {
  const { token } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await householdsApi.myHouseholds(token);
        if (!cancelled) setHouseholds(Array.isArray(data) ? data : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">Weather insights</h1>
      <p className="mt-1 text-sm text-slate-600">
        Climate zone is determined when you add or update household area (city).
      </p>

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading climate insights...</p> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {households.map((h) => (
          <Card key={h._id} className="p-6">
            <div className="text-base font-extrabold text-slate-900">{h.name}</div>
            <div className="mt-2 text-sm text-slate-600">City: {h.location?.city || "Unknown"}</div>
            <div className="mt-1 text-sm text-slate-600">Climate zone: <span className="font-semibold text-slate-800">{h.climateZone || "Unknown"}</span></div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {zoneMessage(h.climateZone)}
            </div>
          </Card>
        ))}
      </div>

      {!loading && households.length === 0 ? <p className="mt-6 text-sm text-slate-500">No households found yet.</p> : null}
    </div>
  );
}
