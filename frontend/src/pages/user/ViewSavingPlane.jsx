import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Sparkles, ArrowLeft } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { savingPlansApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

function extractPlans(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.savingPlans)) return response.savingPlans;
  if (Array.isArray(response?.data?.savingPlans)) return response.data.savingPlans;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export function ViewSavingPlane() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successPopup, setSuccessPopup] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const loadPlans = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await savingPlansApi.getAll(token);
        if (!cancelled) setPlans(extractPlans(response));
      } catch (err) {
        if (!cancelled) {
          setPlans([]);
          setError(err?.message || "Unable to load saving plan details.");
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

  const latestPlan = useMemo(() => plans[0] || null, [plans]);
  const calculation = latestPlan?.savingCalculation || null;

  useEffect(() => {
    const incomingMessage = location.state?.successMessage;
    if (!incomingMessage) return;
    setSuccessPopup(incomingMessage);
    const timeoutId = window.setTimeout(() => setSuccessPopup(""), 2200);
    navigate(location.pathname, { replace: true, state: {} });
    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, location.state, navigate]);

  const handleDelete = async () => {
    if (!token || !latestPlan?._id || deleting) return;
    const confirmed = window.confirm("Are you sure you want to delete this saving plan?");
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      await savingPlansApi.delete(token, latestPlan._id);
      setPlans((prev) => prev.filter((p) => p._id !== latestPlan._id));
      setSuccessPopup("Delete saving plan successfully.");
      window.setTimeout(() => setSuccessPopup(""), 2200);
    } catch (err) {
      setError(err?.message || "Unable to delete saving plan.");
    } finally {
      setDeleting(false);
    }
  };

  const currentStatus = latestPlan?.status || "Active";
  const isActivePlan = currentStatus === "Active";

  const handleMarkCompleted = async () => {
    if (!token || !latestPlan?._id || completing || !isActivePlan) return;

    setCompleting(true);
    setError("");
    try {
      await savingPlansApi.update(token, latestPlan._id, { status: "Completed" });
      setPlans((prev) =>
        prev.map((p) => (p._id === latestPlan._id ? { ...p, status: "Completed" } : p))
      );
      setSuccessPopup("Saving plan marked as completed.");
      window.setTimeout(() => setSuccessPopup(""), 2200);
    } catch (err) {
      setError(err?.message || "Unable to mark saving plan as completed.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {successPopup ? (
        <div className="fixed right-4 top-4 z-50 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {successPopup}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-2xl font-black tracking-tight text-slate-900">View Saving Plan</h1>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Review your latest saving plan, personal tips, and weather-based saving solutions.
          </p>
        </div>
        <Button as={Link} to="/user/saving-plane" variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      {error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">{error}</div>
      ) : null}

      {loading ? (
        <Card className="p-6 text-sm text-slate-600">Loading saving plan...</Card>
      ) : !latestPlan ? (
        <Card className="p-6 text-sm text-slate-600">No saving plan found. Create one first.</Card>
      ) : (
        <>
          {currentStatus === "Inactive" ? (
            <Card className="border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Your plan is inactivated. Please contact admin or create a new saving plan.
            </Card>
          ) : null}
          <Card className="space-y-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Saving Plan Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><span className="text-slate-500">Plan type:</span> <span className="font-medium text-slate-900">{latestPlan.planType}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className="font-medium text-slate-900">{currentStatus}</span></div>
              <div><span className="text-slate-500">Reduction goal:</span> <span className="font-medium text-slate-900">{latestPlan.targetReductionPercentage}%</span></div>
              <div><span className="text-slate-500">Priority:</span> <span className="font-medium text-slate-900">{latestPlan.priorityArea}</span></div>
              <div><span className="text-slate-500">Water source:</span> <span className="font-medium text-slate-900">{latestPlan.waterSource}</span></div>
              <div><span className="text-slate-500">Household size:</span> <span className="font-medium text-slate-900">{latestPlan.householdSize}</span></div>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button as={Link} to={`/user/saving-plane/update/${latestPlan._id}`} variant="outline">
                Update
              </Button>
              <Button type="button" variant="ghost" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </Button>
              {isActivePlan ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleMarkCompleted}
                  disabled={completing}
                >
                  {completing ? "Completing..." : "Mark as Completed"}
                </Button>
              ) : null}
            </div>
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Water Saving Calculation</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
              <div>
                <span className="text-slate-500">Average use:</span>{" "}
                {(calculation?.totalWaterUsagePerDay ?? latestPlan.totalWaterUsagePerDay ?? 0)} L/day
              </div>
              <div>
                <span className="text-slate-500">Target use:</span>{" "}
                {(calculation?.targetDailyUsage ?? 0)} L/day
              </div>
              <div>
                <span className="text-slate-500">Saved water:</span>{" "}
                {(calculation?.waterToSaveLiters ?? 0)} L/day
              </div>
              <div>
                <span className="text-slate-500">Reduction goal:</span>{" "}
                {(calculation?.targetReductionPercentage ?? latestPlan.targetReductionPercentage ?? 0)}%
              </div>
            </div>
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Saving Tips</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
              {(latestPlan.savingTips || []).length > 0 ? (
                latestPlan.savingTips.map((tip, index) => <li key={index}>{tip}</li>)
              ) : (
                <li>No saving tips available.</li>
              )}
            </ul>
          </Card>

          <Card className="space-y-3 p-6">
            <h2 className="text-lg font-semibold text-slate-900">Weather-Based Saving Solutions</h2>
            <div className="grid gap-3 sm:grid-cols-2 text-sm text-slate-700">
              <div><span className="text-slate-500">Location:</span> {latestPlan.weatherData?.location || "Unknown"}</div>
              <div><span className="text-slate-500">Weather:</span> {latestPlan.weatherData?.weather || latestPlan.weatherData?.description || "Unknown"}</div>
              <div><span className="text-slate-500">Temperature:</span> {latestPlan.weatherData?.temperature != null ? `${latestPlan.weatherData.temperature}°C` : "N/A"}</div>
              <div><span className="text-slate-500">Advice:</span> {latestPlan.weatherData?.gardenAdvice || "No weather-based advice available."}</div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
