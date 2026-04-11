import React, { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { savingPlansApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Sparkles } from "lucide-react";

export function SavingPlaneA() {
  const { token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      </div>

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
                    {plan.planType === "Custom"
                      ? `${plan.customGoalPercentage ?? plan.targetReductionPercentage}%`
                      : `${plan.targetReductionPercentage}%`}
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
