import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { BrandLogo } from "../../components/BrandLogo";
import { CloudSun, CloudRain, Sun, ThermometerSun, MapPin, Wind, Sparkles } from "lucide-react";

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
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await householdsApi.myHouseholds(token);
        if (!cancelled) setHouseholds(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load weather insights.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const dryCount = households.filter((h) => String(h.climateZone || "").toLowerCase().includes("dry")).length;
  const wetCount = households.filter((h) => String(h.climateZone || "").toLowerCase().includes("wet")).length;
  const intermediateCount = households.filter(
    (h) => !String(h.climateZone || "").toLowerCase().includes("wet") && !String(h.climateZone || "").toLowerCase().includes("dry")
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/40 bg-gradient-to-br from-blue-800 via-blue-900 to-slate-900 p-7 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="relative grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">Climate Intelligence</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Weather Insights</h1>
            <p className="mt-2 text-sm text-sky-50/95">
              Climate zone is determined when you add or update household location (city).
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Tracked Households</span>
              <CloudSun className="h-4 w-4" />
            </div>
            <div className="mt-3 text-4xl font-black">{households.length}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dry Zone Risk</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{dryCount}</p>
            </div>
            <Sun className="h-6 w-6 text-amber-600" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Wet Zone</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{wetCount}</p>
            </div>
            <CloudRain className="h-6 w-6 text-cyan-600" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Intermediate</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{intermediateCount}</p>
            </div>
            <ThermometerSun className="h-6 w-6 text-violet-600" />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-slate-900">
            <Wind className="h-5 w-5 text-brand-700" />
            <p className="text-sm font-extrabold">Climate distribution</p>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Dry zones</span>
              <span className="font-bold">{dryCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Wet zones</span>
              <span className="font-bold">{wetCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Intermediate zones</span>
              <span className="font-bold">{intermediateCount}</span>
            </div>
          </div>
        </Card>
        <Card className="border border-sky-100 bg-gradient-to-r from-sky-50/80 to-cyan-50/80 p-5">
          <div className="flex items-center gap-2 text-slate-900">
            <BrandLogo className="h-5 w-5" alt="" />
            <p className="text-sm font-extrabold">Recommendation</p>
          </div>
          <p className="mt-2 text-sm text-slate-700">
            Keep household city details accurate. Weather zone updates improve bill prediction quality for your households.
          </p>
        </Card>
      </section>

      {error ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading climate insights...</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {households.map((h) => (
          <Card key={h._id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-base font-extrabold text-slate-900">{h.name}</div>
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
                {h.climateZone || "Unknown"}
              </span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              City: {h.location?.city || "Unknown"}
            </div>
            <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {zoneMessage(h.climateZone)}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
              <Sparkles className="h-3.5 w-3.5" />
              Climate-adjusted household estimate enabled
            </div>
          </Card>
        ))}
      </div>

      {!loading && households.length === 0 ? <p className="mt-6 text-sm text-slate-500">No households found yet.</p> : null}
    </div>
  );
}
