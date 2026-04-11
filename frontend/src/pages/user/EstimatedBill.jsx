import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { BrandLogo } from "../../components/BrandLogo";
import { Button } from "../../components/ui/Button";
import { jsPDF } from "jspdf";
import { Receipt, Gauge, CloudSun, Sparkles, TrendingUp, Wallet, Download, Lightbulb } from "lucide-react";

export function EstimatedBill() {
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
        if (!cancelled) setError(err?.message || "Failed to load estimated bill data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const total = useMemo(
    () => households.reduce((a, h) => a + Number(h.predictedBill || 0), 0),
    [households]
  );

  const totalLiters = useMemo(
    () => households.reduce((a, h) => a + Number(h.estimatedMonthlyLiters || 0), 0),
    [households]
  );

  const totalUnits = useMemo(
    () => households.reduce((a, h) => a + Number(h.estimatedMonthlyUnits || 0), 0),
    [households]
  );
  const averageBill = households.length ? total / households.length : 0;
  const highestHousehold = useMemo(() => {
    if (!households.length) return null;
    return [...households].sort((a, b) => Number(b.predictedBill || 0) - Number(a.predictedBill || 0))[0];
  }, [households]);

  function onDownloadEstimatedBill() {
    const today = new Date().toISOString().slice(0, 10);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 42;
    let y = 56;

    const addPageFooter = () => {
      doc.setDrawColor(220, 225, 235);
      doc.line(left, pageHeight - 36, pageWidth - left, pageHeight - 36);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("SmartWater • Estimated Bill Report", left, pageHeight - 20);
      doc.text(`Generated: ${today}`, pageWidth - left - 90, pageHeight - 20);
    };

    const ensureSpace = (needed = 16) => {
      if (y > pageHeight - (48 + needed)) {
        addPageFooter();
        doc.addPage();
        y = 56;
      }
    };

    const addLine = (text, size = 10, gap = 16, color = [15, 23, 42]) => {
      ensureSpace(gap + 8);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(String(text), left, y);
      y += gap;
    };

    const maxTextW = pageWidth - left * 2 - 24;
    const addWrappedLines = (text, size = 9, lineGap = 13, indent = left + 12) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.setTextColor(51, 65, 85);
      const lines = doc.splitTextToSize(String(text), maxTextW - (indent - left));
      lines.forEach((line) => {
        ensureSpace(lineGap + 4);
        doc.text(line, indent, y);
        y += lineGap;
      });
    };

    // Header banner
    doc.setFillColor(10, 172, 190);
    doc.roundedRect(left, y - 26, pageWidth - left * 2, 84, 10, 10, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(21);
    doc.text("Estimated Water Bill Report", left + 16, y + 8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("A household-wise monthly estimation summary", left + 16, y + 26);
    doc.text(`Date: ${today}`, left + 16, y + 42);
    y += 86;

    // Summary cards
    const boxGap = 10;
    const boxW = (pageWidth - left * 2 - boxGap) / 2;
    const drawSummaryBox = (x, yPos, title, value) => {
      doc.setFillColor(245, 249, 255);
      doc.setDrawColor(214, 223, 236);
      doc.roundedRect(x, yPos, boxW, 46, 8, 8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(title, x + 12, yPos + 16);
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(value, x + 12, yPos + 34);
    };

    drawSummaryBox(left, y, "Total Households", String(households.length));
    drawSummaryBox(left + boxW + boxGap, y, "Total Estimated Bill (Rs.)", total.toFixed(2));
    y += 54;
    drawSummaryBox(left, y, "Total Estimated Liters", Number(totalLiters || 0).toLocaleString());
    drawSummaryBox(left + boxW + boxGap, y, "Average Bill / Household (Rs.)", averageBill.toFixed(2));
    y += 68;

    doc.setFont("helvetica", "bold");
    addLine("Detailed Household Breakdown", 12, 18);
    doc.setFont("helvetica", "normal");
    addLine(`Total Estimated Units: ${totalUnits.toFixed(2)}`, 10, 16, [71, 85, 105]);
    y += 4;

    households.forEach((h, idx) => {
      ensureSpace(84);
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(227, 232, 240);
      doc.roundedRect(left, y - 10, pageWidth - left * 2, 76, 8, 8, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${idx + 1}. ${h.name || "N/A"}`, left + 12, y + 8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`City: ${h.location?.city || "N/A"}`, left + 12, y + 26);
      doc.text(`Climate Zone: ${h.climateZone || "Unknown"}`, left + 180, y + 26);
      doc.text(`Estimated Liters: ${Number(h.estimatedMonthlyLiters || 0).toLocaleString()}`, left + 12, y + 44);
      doc.text(`Estimated Units: ${Number(h.estimatedMonthlyUnits || 0).toFixed(2)}`, left + 220, y + 44);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(3, 105, 161);
      doc.text(`Predicted Bill: Rs. ${Number(h.predictedBill || 0).toFixed(2)}`, left + 12, y + 62);
      y += 88;

      const recs = Array.isArray(h.billRecommendations) ? h.billRecommendations : [];
      if (recs.length) {
        ensureSpace(28);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`Recommendations — ${h.name || "Household"}`, left + 12, y);
        y += 18;
        recs.forEach((r, ri) => {
          addWrappedLines(`${ri + 1}. ${r}`, 9, 12, left + 20);
        });
        y += 10;
      }
    });

    addPageFooter();
    doc.save(`estimated-water-bill-${today}.pdf`);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200/40 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-7 text-white shadow-xl">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
        <div className="relative grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Billing Intelligence</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Estimated Water Bill</h1>
            <p className="mt-2 text-sm text-emerald-50/95 pr-8">
              Bill is estimated using household residents, climate factor, and monthly unit rate.
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDownloadEstimatedBill}
              disabled={loading || households.length === 0}
              className="mt-4 h-8 bg-white/90 px-3 text-xs text-emerald-700 hover:bg-white"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>
          </div>
          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total Monthly Bill</span>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="mt-3 text-4xl font-black">Rs. {total.toFixed(2)}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Liters</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalLiters.toLocaleString()}</p>
            </div>
            <BrandLogo className="h-6 w-6" alt="" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimated Units</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{totalUnits.toFixed(2)}</p>
            </div>
            <Gauge className="h-6 w-6 text-violet-600" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Households Count</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{households.length}</p>
            </div>
            <Receipt className="h-6 w-6 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Bill / Household</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{averageBill.toFixed(2)}</p>
            </div>
            <Wallet className="h-6 w-6 text-amber-600" />
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Bill Contributor</p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-base font-extrabold text-slate-900">{highestHousehold?.name || "No data yet"}</p>
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
              {highestHousehold ? `Rs. ${Number(highestHousehold.predictedBill || 0).toFixed(2)}` : "-"}
            </span>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-slate-900">
            <TrendingUp className="h-5 w-5 text-brand-700" />
            <p className="text-sm font-extrabold">Billing insight</p>
          </div>
          <p className="mt-2 text-sm text-slate-700">
            Highest bills often appear in dry climate zones and larger households. Updating city details helps keep estimates accurate.
          </p>
        </Card>
      </section>

      {error ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Household</th>
                <th className="px-4 py-3">Liters</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Climate zone</th>
                <th className="px-4 py-3">Predicted bill</th>
                <th className="px-4 py-3">Insight</th>
                <th className="min-w-[140px] px-4 py-3">AI tips</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Loading...</td></tr>
              ) : households.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">No households yet.</td></tr>
              ) : (
                households.map((h) => (
                  <tr key={h._id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{h.name}</td>
                    <td className="px-4 py-3">{Number(h.estimatedMonthlyLiters || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{Number(h.estimatedMonthlyUnits || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">{h.climateZone || "Unknown"}</td>
                    <td className="px-4 py-3 font-semibold">{Number(h.predictedBill || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
                        <CloudSun className="h-3.5 w-3.5 text-brand-700" />
                        {(h.climateZone || "Intermediate")} factor applied
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {Array.isArray(h.billRecommendations) && h.billRecommendations.length > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 font-semibold text-violet-800 ring-1 ring-violet-100">
                          <Lightbulb className="h-3.5 w-3.5" />
                          {h.billRecommendations.length} tip{h.billRecommendations.length === 1 ? "" : "s"}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-violet-600" />
          <h2 className="text-lg font-extrabold text-slate-900">Personalized recommendations</h2>
        </div>
        <p className="text-sm text-slate-600">
          Generated from your household profile, climate zone, and estimated bill (OpenAI). Shown per household below; the same tips are included in your email and PDF export.
        </p>
        {households.some((h) => (Array.isArray(h.billRecommendations) ? h.billRecommendations : []).length > 0) ? (
          <div className="grid gap-4 md:grid-cols-2">
            {households.map((h) => {
              const recs = Array.isArray(h.billRecommendations) ? h.billRecommendations.filter(Boolean) : [];
              if (!recs.length) return null;
              const gen = h.billRecommendationsGeneratedAt
                ? new Date(h.billRecommendationsGeneratedAt).toLocaleString()
                : null;
              return (
                <Card key={h._id} className="border-violet-100 bg-gradient-to-br from-white to-violet-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Household</p>
                  <p className="mt-1 text-base font-extrabold text-slate-900">{h.name}</p>
                  {gen ? (
                    <p className="mt-1 text-xs text-slate-500">Updated {gen}</p>
                  ) : null}
                  <ul className="mt-4 list-inside list-decimal space-y-2 text-sm text-slate-700">
                    {recs.map((tip, i) => (
                      <li key={i} className="pl-1 marker:font-semibold">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-600">
            No tips were returned for your households. Refresh this page— the server fills missing recommendations on
            load. If this persists, confirm the backend is running the latest code and check the server console for
            errors.
          </Card>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-100">
        <div>
          Total estimated monthly bill: <span className="font-bold">{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
