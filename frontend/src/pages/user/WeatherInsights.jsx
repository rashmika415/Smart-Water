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
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Weather insights</h1>
        <p className="mt-1 text-sm text-slate-600">
          Climate zone is set when you add or update a household location (city).
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Tracked households"
          value={String(households.length)}
          helper="Linked to your account"
          icon={CloudSun}
          cardTone="from-sky-50 to-cyan-50 border-sky-100"
          iconTone="bg-sky-100 text-sky-700"
        />
        <SummaryMetric
          label="Dry zone"
          value={String(dryCount)}
          helper="Higher demand factor"
          icon={Sun}
          cardTone="from-amber-50 to-orange-50 border-amber-100"
          iconTone="bg-amber-100 text-amber-700"
        />
        <SummaryMetric
          label="Wet zone"
          value={String(wetCount)}
          helper="Lower demand factor"
          icon={CloudRain}
          cardTone="from-cyan-50 to-blue-50 border-cyan-100"
          iconTone="bg-cyan-100 text-cyan-700"
        />
        <SummaryMetric
          label="Intermediate"
          value={String(intermediateCount)}
          helper="Neutral adjustment"
          icon={ThermometerSun}
          cardTone="from-violet-50 to-indigo-50 border-violet-100"
          iconTone="bg-violet-100 text-violet-700"
        />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <Card className="border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Wind className="h-4 w-4 text-sky-600" />
            Climate distribution
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-50/80 to-orange-50/40 px-3 py-2.5 ring-1 ring-amber-100/80">
              <span className="font-medium">Dry zones</span>
              <span className="font-black text-slate-900">{dryCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-cyan-50/80 to-sky-50/40 px-3 py-2.5 ring-1 ring-cyan-100/80">
              <span className="font-medium">Wet zones</span>
              <span className="font-black text-slate-900">{wetCount}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-violet-50/80 to-indigo-50/40 px-3 py-2.5 ring-1 ring-violet-100/80">
              <span className="font-medium">Intermediate</span>
              <span className="font-black text-slate-900">{intermediateCount}</span>
            </div>
          </div>
        </Card>

        <Card className="border border-sky-100 bg-gradient-to-br from-sky-50/90 to-cyan-50/50 p-5 ring-1 ring-sky-100/80">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sky-700 ring-1 ring-sky-100">
              <BrandLogo className="h-4 w-4" alt="" />
            </span>
            <div>
              <p className="text-sm font-extrabold text-slate-900">Recommendation</p>
              <p className="mt-1 text-sm text-slate-600">
                Keep household city details accurate. Weather zone updates improve bill prediction quality.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading climate insights...</p> : null}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {households.map((h) => (
          <Card
            key={h._id}
            className="border border-slate-200/80 bg-gradient-to-br from-white via-sky-50/20 to-cyan-50/30 p-5 shadow-sm ring-1 ring-slate-100/80"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-base font-extrabold text-slate-900">{h.name}</div>
              <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 ring-1 ring-sky-200/80">
                {h.climateZone || "Unknown"}
              </span>
            </div>
            <div className="mt-2 inline-flex items-center gap-1 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              City: {h.location?.city || "Unknown"}
            </div>
            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2.5 text-sm text-slate-700">
              {zoneMessage(h.climateZone)}
            </div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
              <Sparkles className="h-3.5 w-3.5" />
              Climate-adjusted estimate enabled
            </div>
          </Card>
        ))}
      </div>

      {!loading && households.length === 0 ? (
        <Card className="mt-6 border border-dashed border-slate-200 bg-slate-50/90 p-6 text-sm text-slate-600">
          No households found yet. Create one to see climate zones here.
        </Card>
      ) : null}
    </div>
  );
}
