import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { savingPlansApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Sparkles } from "lucide-react";

export function SavingPlaneA() {
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingPlanId, setUpdatingPlanId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [reportRows, setReportRows] = useState([]);
  const [reportMeta, setReportMeta] = useState(null);

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

  const handleInactivatePlan = async (planId) => {
    if (!token || !planId || updatingPlanId) return;

    setUpdatingPlanId(planId);
    setError("");
    setSuccessMessage("");
    try {
      await savingPlansApi.update(token, planId, { status: "Inactive" });
      setPlans((prev) =>
        prev.map((plan) => (plan._id === planId ? { ...plan, status: "Inactive" } : plan))
      );
      setSuccessMessage("Saving plan status updated to Inactive.");
      window.setTimeout(() => setSuccessMessage(""), 2200);
    } catch (err) {
      setError(err?.message || "Unable to update saving plan status.");
    } finally {
      setUpdatingPlanId("");
    }
  };

  const escapeCsv = (value) => {
    const stringValue = value == null ? "" : String(value);
    if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleGenerateReport = () => {
    const rows = plans.map((plan) => ({
      household: plan.householdName || plan.householdId || "Unknown",
      ownerName: plan.user?.name || "Unknown",
      ownerEmail: plan.user?.email || "Unknown",
      planType: plan.planType || "Unknown",
      target:
        plan.planType === "Custom"
          ? `${plan.customGoalPercentage ?? plan.targetReductionPercentage ?? 0}%`
          : `${plan.targetReductionPercentage ?? 0}%`,
      priorityArea: plan.priorityArea || "Unknown",
      waterSource: plan.waterSource || "Unknown",
      status: plan.status || "Active",
      createdAt: plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "N/A",
    }));

    const now = new Date();
    const activeCount = rows.filter((row) => row.status === "Active").length;
    const completedCount = rows.filter((row) => row.status === "Completed").length;
    const inactiveCount = rows.filter((row) => row.status === "Inactive").length;

    setReportRows(rows);
    setReportMeta({
      generatedAt: now,
      totalPlans: rows.length,
      activeCount,
      completedCount,
      inactiveCount,
    });
    setSuccessMessage("Report generated successfully. You can download it now.");
    window.setTimeout(() => setSuccessMessage(""), 2200);
  };

  const handleDownloadReport = () => {
    if (!reportRows.length || !reportMeta) {
      setError("Generate the report first before downloading.");
      return;
    }

    const header = [
      "Household",
      "Owner Name",
      "Owner Email",
      "Plan Type",
      "Target",
      "Priority",
      "Water Source",
      "Status",
      "Created Date",
    ];
    const rows = reportRows.map((row) => [
      row.household,
      row.ownerName,
      row.ownerEmail,
      row.planType,
      row.target,
      row.priorityArea,
      row.waterSource,
      row.status,
      row.createdAt,
    ]);

    const summaryRows = [
      [],
      ["Generated At", reportMeta.generatedAt.toLocaleString()],
      ["Total Plans", reportMeta.totalPlans],
      ["Active Plans", reportMeta.activeCount],
      ["Completed Plans", reportMeta.completedCount],
      ["Inactive Plans", reportMeta.inactiveCount],
    ];

    const csvContent = [header, ...rows, ...summaryRows]
      .map((csvRow) => csvRow.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = reportMeta.generatedAt.toISOString().split("T")[0];
    link.href = url;
    link.download = `saving-plans-report-${datePart}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
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
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={handleGenerateReport} disabled={loading}>
            Generate Report
          </Button>
          <Button
            type="button"
            variant="dark"
            onClick={handleDownloadReport}
            disabled={!reportRows.length}
          >
            Download Report
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          {successMessage}
        </div>
      ) : null}
      {reportMeta ? (
        <Card className="grid gap-3 p-4 text-sm text-slate-700 sm:grid-cols-4">
          <div><span className="text-slate-500">Generated:</span> {reportMeta.generatedAt.toLocaleString()}</div>
          <div><span className="text-slate-500">Total:</span> {reportMeta.totalPlans}</div>
          <div><span className="text-slate-500">Completed:</span> {reportMeta.completedCount}</div>
          <div><span className="text-slate-500">Inactive:</span> {reportMeta.inactiveCount}</div>
        </Card>
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
              <th className="px-4 py-4 text-left font-semibold">Actions</th>
              <th className="px-4 py-4 text-left font-semibold">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                  Loading saving plans...
                </td>
              </tr>
            ) : plans.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
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
                    {plan.planType === "Custom"
                      ? `${plan.customGoalPercentage ?? plan.targetReductionPercentage}%`
                      : `${plan.targetReductionPercentage}%`}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{plan.priorityArea}</td>
                  <td className="px-4 py-4 text-slate-600">{plan.waterSource}</td>
                  <td className="px-4 py-4 text-slate-600">{plan.status || "Active"}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {(plan.status || "Active") !== "Inactive" ? (
                      <button
                        type="button"
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={() => handleInactivatePlan(plan._id)}
                        disabled={Boolean(updatingPlanId)}
                      >
                        {updatingPlanId === plan._id ? "Updating..." : "Inactivate"}
                      </button>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">Already inactive</span>
                    )}
                  </td>
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
