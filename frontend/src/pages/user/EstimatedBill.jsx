import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { BrandLogo } from "../../components/BrandLogo";
import { Button } from "../../components/ui/Button";
import { jsPDF } from "jspdf";
import { Receipt, Gauge, CloudSun, Sparkles, TrendingUp, Wallet, Download, Lightbulb } from "lucide-react";

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
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Estimated water bill</h1>
          <p className="mt-1 text-sm text-slate-600">
            Estimates use residents, climate factor, and monthly unit rate—export matches email content.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="gap-2"
          onClick={onDownloadEstimatedBill}
          disabled={loading || households.length === 0}
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Total monthly bill"
          value={`Rs. ${total.toFixed(2)}`}
          helper="All households combined"
          icon={Sparkles}
          cardTone="from-sky-50 to-cyan-50 border-sky-100"
          iconTone="bg-sky-100 text-sky-700"
        />
        <SummaryMetric
          label="Estimated liters"
          value={totalLiters.toLocaleString()}
          helper="Monthly estimate"
          icon={BrandLogo}
          cardTone="from-emerald-50 to-lime-50 border-emerald-100"
          iconTone="bg-emerald-100 text-emerald-700"
        />
        <SummaryMetric
          label="Estimated units"
          value={totalUnits.toFixed(2)}
          helper="Cubic meters (m³)"
          icon={Gauge}
          cardTone="from-violet-50 to-indigo-50 border-violet-100"
          iconTone="bg-violet-100 text-violet-700"
        />
        <SummaryMetric
          label="Avg bill / household"
          value={averageBill.toFixed(2)}
          helper={households.length ? `${households.length} home(s)` : "No households"}
          icon={Wallet}
          cardTone="from-amber-50 to-orange-50 border-amber-100"
          iconTone="bg-amber-100 text-amber-700"
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <SummaryMetric
          label="Households"
          value={String(households.length)}
          helper="In this summary"
          icon={Receipt}
          cardTone="from-teal-50 to-cyan-50 border-teal-100"
          iconTone="bg-teal-100 text-teal-700"
        />
        <Card className="border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/80 p-4 ring-1 ring-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Top bill contributor</div>
              <div className="mt-2 text-lg font-black text-slate-900">{highestHousehold?.name || "No data yet"}</div>
              <div className="mt-1 text-xs text-slate-500">
                {highestHousehold ? `Rs. ${Number(highestHousehold.predictedBill || 0).toFixed(2)} estimated` : "Add a household to see rankings"}
              </div>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
        </Card>
      </div>

      <Card className="mt-5 border border-sky-100 bg-gradient-to-br from-sky-50/80 to-cyan-50/50 p-5 ring-1 ring-sky-100/80">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sky-700 ring-1 ring-sky-100">
            <CloudSun className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-extrabold text-slate-900">Billing insight</p>
            <p className="mt-1 text-sm text-slate-600">
              Highest bills often track dry climate zones and larger households. Keep city details accurate for better forecasts.
            </p>
          </div>
        </div>
      </Card>

      {error ? (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      <Card className="mt-6 overflow-hidden border border-slate-200/80 p-0 shadow-sm">
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

      <section className="mt-6 space-y-4">
        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-700">Personalized recommendations</h2>
          <p className="mt-1 text-sm text-slate-600">
            From your profile, climate zone, and bill estimate—included in email and PDF too.
          </p>
        </div>
        {households.some((h) => (Array.isArray(h.billRecommendations) ? h.billRecommendations : []).length > 0) ? (
          <div className="grid gap-4 md:grid-cols-2">
            {households.map((h) => {
              const recs = Array.isArray(h.billRecommendations) ? h.billRecommendations.filter(Boolean) : [];
              if (!recs.length) return null;
              const gen = h.billRecommendationsGeneratedAt
                ? new Date(h.billRecommendationsGeneratedAt).toLocaleString()
                : null;
              return (
                <Card key={h._id} className="border border-violet-100 bg-gradient-to-br from-violet-50/70 to-indigo-50/40 p-5 ring-1 ring-violet-100/60">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-600">Household</p>
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
          <Card className="border border-dashed border-slate-200 bg-slate-50/90 p-5 text-sm text-slate-600">
            No tips were returned for your households. Refresh this page— the server fills missing recommendations on
            load. If this persists, confirm the backend is running the latest code and check the server console for
            errors.
          </Card>
        )}
      </section>

      <Card className="mt-5 border border-emerald-100 bg-gradient-to-r from-emerald-50/90 to-teal-50/60 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-100/80">
        <span className="font-semibold">Total estimated monthly bill:</span>{" "}
        <span className="font-black text-emerald-950">Rs. {total.toFixed(2)}</span>
      </Card>
    </div>
  );
}
