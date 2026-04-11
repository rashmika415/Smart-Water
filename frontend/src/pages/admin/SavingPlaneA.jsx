import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { savingPlansApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Download, FileText, Sparkles } from "lucide-react";
import { jsPDF } from "jspdf";
import { pdfEnsureSpace, pdfFooterLine, pdfHeaderBanner } from "../../lib/adminPdf";

export function SavingPlaneA() {
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  const getTargetText = (plan) => {
    const target = plan?.planType === "Custom"
      ? plan?.customGoalPercentage ?? plan?.targetReductionPercentage
      : plan?.targetReductionPercentage;
    return target === undefined || target === null ? "-" : `${target}%`;
  };

  const extractPlans = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.savingPlans)) return response.savingPlans;
    if (Array.isArray(response?.data?.savingPlans)) return response.data.savingPlans;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const loadPlans = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await savingPlansApi.getAll(token);
        if (!cancelled) {
          const results = extractPlans(response);
          setPlans(results);
          setLastUpdatedAt(new Date().toISOString());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Unable to load saving plans.");
          setPlans([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPlans();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((plan) => String(plan?.status || "active").toLowerCase() === "active").length;
    const custom = plans.filter((plan) => String(plan?.planType || "").toLowerCase() === "custom").length;
    const uniqueHouseholds = new Set(plans.map((plan) => plan?.householdName || plan?.householdId).filter(Boolean)).size;
    return { total, active, custom, uniqueHouseholds };
  }, [plans]);

  const downloadCsvReport = () => {
    if (loading || reportBusy) return;

    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Generated At", new Date().toLocaleString()],
      ["Last Data Refresh", lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : "Unknown"],
      ["Total Plans", stats.total],
      ["Active Plans", stats.active],
      ["Custom Plans", stats.custom],
      ["Covered Households", stats.uniqueHouseholds],
      [],
      ["Household", "Owner", "Plan Type", "Target", "Priority", "Water Source", "Status", "Created"],
      ...plans.map((plan) => [
        plan?.householdName || plan?.householdId || "-",
        plan?.user?.name || plan?.user?.email || "Unknown",
        plan?.planType || "-",
        getTargetText(plan),
        plan?.priorityArea || "-",
        plan?.waterSource || "-",
        plan?.status || "Active",
        plan?.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "-",
      ]),
    ];

    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-saving-plans-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPdfReport = () => {
    if (loading || reportBusy) return;

    setReportBusy(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const left = 40;
      const pageWidth = doc.internal.pageSize.getWidth();
      const generatedAt = new Date();

      let y = pdfHeaderBanner(doc, {
        title: "Admin Saving Plans Report",
        subtitle: `Generated ${generatedAt.toLocaleString()}`,
        left,
      });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Summary", left, y);
      y += 20;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const summaryRows = [
        ["Total plans", stats.total],
        ["Active plans", stats.active],
        ["Custom plans", stats.custom],
        ["Covered households", stats.uniqueHouseholds],
        ["Last data refresh", lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : "Unknown"],
      ];

      summaryRows.forEach(([label, value]) => {
        doc.setTextColor(71, 85, 105);
        doc.text(`${label}`, left, y);
        doc.setTextColor(15, 23, 42);
        doc.text(String(value), pageWidth - left, y, { align: "right" });
        y += 18;
      });

      y += 8;
      doc.setDrawColor(226, 232, 240);
      doc.line(left, y, pageWidth - left, y);
      y += 20;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Plans list", left, y);
      y += 16;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const header = "Household | Owner | Type | Target | Status | Created";
      y = pdfEnsureSpace(doc, y, 30, left, pageWidth);
      doc.setTextColor(51, 65, 85);
      doc.text(header, left, y);
      y += 14;

      plans.forEach((plan) => {
        y = pdfEnsureSpace(doc, y, 26, left, pageWidth);
        const line = [
          plan?.householdName || plan?.householdId || "-",
          plan?.user?.name || plan?.user?.email || "Unknown",
          plan?.planType || "-",
          getTargetText(plan),
          plan?.status || "Active",
          plan?.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "-",
        ].join(" | ");

        doc.setTextColor(15, 23, 42);
        doc.text(line.slice(0, 115), left, y);
        y += 14;
      });

      pdfFooterLine(doc, left);
      doc.save(`admin-saving-plans-report-${generatedAt.toISOString().slice(0, 10)}.pdf`);
    } finally {
      setReportBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-brand-600">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Saving Plans</h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Review the active water savings plans and the household owners who created them.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadPdfReport}
            disabled={loading || reportBusy}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {reportBusy ? "Preparing..." : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={downloadCsvReport}
            disabled={loading || reportBusy}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            Download CSV
          </button>
        </div>
      </div>

      <Card className="border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Context</div>
        <h2 className="mt-2 text-xl font-black tracking-tight text-slate-900">Saving plans overview</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Track adoption and quality of saving plans across households, then export this snapshot as PDF or CSV
          for audits and monthly reporting.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total plans</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "-" : stats.total}</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active plans</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "-" : stats.active}</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custom plans</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "-" : stats.custom}</div>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Households covered</div>
            <div className="mt-1 text-2xl font-black text-slate-900">{loading ? "-" : stats.uniqueHouseholds}</div>
          </div>
        </div>
        <div className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Last refresh: {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString() : "Loading"}
        </div>
      </Card>

      {error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-4 text-left font-semibold">Household</th>
              <th className="px-4 py-4 text-left font-semibold">Owner</th>
              <th className="px-4 py-4 text-left font-semibold">Plan Type</th>
              <th className="px-4 py-4 text-left font-semibold">Target</th>
              <th className="px-4 py-4 text-left font-semibold">Priority</th>
              <th className="px-4 py-4 text-left font-semibold">Water Source</th>
              <th className="px-4 py-4 text-left font-semibold">Status</th>
              <th className="px-4 py-4 text-left font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  Loading saving plans...
                </td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                  No saving plans found.
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan._id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                    {plan.householdName || plan.householdId || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    {plan.user?.name || plan.user?.email || "Unknown"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{plan.planType}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {getTargetText(plan)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{plan.priorityArea}</td>
                  <td className="px-4 py-4 text-slate-600">{plan.waterSource}</td>
                  <td className="px-4 py-4 text-slate-600">{plan.status || "Active"}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                    {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
