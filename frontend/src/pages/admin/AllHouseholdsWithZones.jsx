import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { HouseholdCard } from "../../components/HouseholdCard";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { pdfEnsureSpace, pdfFooterLine, pdfHeaderBanner } from "../../lib/adminPdf";
import { Download, Home, Layers, BarChart3, RefreshCw } from "lucide-react";
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

function truncateLabel(name, max = 14) {
  const s = String(name || "—");
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function downloadHouseholdsZonesPdf(rows) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toISOString().slice(0, 10);
  let y = pdfHeaderBanner(doc, {
    title: "Households & zones",
    subtitle: `Generated ${today} · ${rows.length} household(s)`,
    left,
  });

  rows.forEach((row, idx) => {
    const h = row.household;
    const zones = row.zones || [];
    y = pdfEnsureSpace(doc, y, 36, left, pageWidth);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${idx + 1}. ${String(h?.name || "—").slice(0, 48)}`, left, y);
    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const loc = [h?.location?.city, h?.location?.state, h?.location?.country].filter(Boolean).join(", ");
    doc.text(`Location: ${loc || "—"} · ${h?.numberOfResidents ?? "—"} residents · ${h?.propertyType || "—"}`, left, y);
    y += 12;
    if (h?.predictedBill != null) {
      doc.text(`Est. bill: Rs. ${Number(h.predictedBill).toFixed(2)} · Climate: ${h?.climateZone || "—"}`, left, y);
      y += 12;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Zones (${zones.length}):`, left, y);
    y += 12;
    doc.setFont("helvetica", "normal");
    if (zones.length === 0) {
      doc.text("  (none)", left + 8, y);
      y += 14;
    } else {
      zones.forEach((z) => {
        y = pdfEnsureSpace(doc, y, 16, left, pageWidth);
        const line = `  • ${z.zoneName || "—"}${z.notes ? ` — ${String(z.notes).slice(0, 80)}` : ""}`;
        doc.text(line.slice(0, 95), left + 8, y);
        y += 14;
      });
    }
    y += 10;
  });

  pdfFooterLine(doc, left);
  doc.save(`admin-households-zones-${today}.pdf`);
}

export function AllHouseholdsWithZones() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const data = await householdsApi.allWithZones(token);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || "Failed to load data");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const n = rows.length;
    let totalZones = 0;
    let maxZones = 0;
    rows.forEach((r) => {
      const c = r.zones?.length || 0;
      totalZones += c;
      if (c > maxZones) maxZones = c;
    });
    const avg = n ? (totalZones / n).toFixed(1) : "0";
    return { n, totalZones, maxZones, avg };
  }, [rows]);

  const zoneCountChartData = useMemo(() => {
    return [...rows]
      .map((r) => ({
        name: truncateLabel(r.household?.name, 12),
        zones: r.zones?.length || 0,
      }))
      .sort((a, b) => b.zones - a.zones)
      .slice(0, 10);
  }, [rows]);

  function onDownloadPdf() {
    if (!rows.length) return;
    downloadHouseholdsZonesPdf(rows);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">All households with zones</h1>
          <p className="mt-1 text-sm text-slate-600">
            Each card is a household; expand to see nested zones (relational view).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" className="gap-2" onClick={onDownloadPdf} disabled={loading || rows.length === 0}>
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
          <Button type="button" variant="ghost" className="gap-2" onClick={load} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {!loading && rows.length > 0 ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryMetric
              label="Households"
              value={String(stats.n)}
              helper="In system"
              icon={Home}
              cardTone="from-sky-50 to-cyan-50 border-sky-100"
              iconTone="bg-sky-100 text-sky-700"
            />
            <SummaryMetric
              label="Total zones"
              value={String(stats.totalZones)}
              helper="All nested zones"
              icon={Layers}
              cardTone="from-violet-50 to-indigo-50 border-violet-100"
              iconTone="bg-violet-100 text-violet-700"
            />
            <SummaryMetric
              label="Avg zones / home"
              value={String(stats.avg)}
              helper="Mean across households"
              icon={BarChart3}
              cardTone="from-emerald-50 to-teal-50 border-emerald-100"
              iconTone="bg-emerald-100 text-emerald-700"
            />
            <SummaryMetric
              label="Most zones (one HH)"
              value={String(stats.maxZones)}
              helper="Largest zone count"
              icon={Layers}
              cardTone="from-amber-50 to-orange-50 border-amber-100"
              iconTone="bg-amber-100 text-amber-700"
            />
          </div>

          <Card className="mt-5 border border-slate-200/80 p-5 shadow-sm">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Top households by zone count</h2>
            <p className="mt-1 text-xs text-slate-500">Up to 10 homes with the most zones (short names on axis).</p>
            <div className="mt-4 h-[280px] w-full min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneCountChartData} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`${v} zones`, "Count"]} />
                  <Bar dataKey="zones" fill="#14b8a6" radius={[0, 6, 6, 0]} name="Zones" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="mt-10 flex justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="mt-3 text-sm text-slate-600">Loading households…</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {rows.length === 0 ? (
            <Card className="border border-dashed border-slate-200 bg-slate-50/90 p-6 text-sm text-slate-600">
              No households yet.
            </Card>
          ) : (
            rows.map((row, i) => (
              <HouseholdCard
                key={row.household?._id || i}
                household={row.household}
                zones={row.zones || []}
                defaultOpen={i === 0}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
