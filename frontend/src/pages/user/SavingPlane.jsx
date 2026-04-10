import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { savingPlansApi, usageApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";

const PLAN_TYPES = ["Basic", "Advanced", "Custom"];
const PRIORITY_AREAS = ["General", "Kitchen", "Bathroom", "Garden", "Laundry"];
const WATER_SOURCES = ["Municipal", "Well", "Rainwater", "Mixed"];


const planSummary = {
  Basic: "A starter plan with a 10% reduction target and easy daily savings habits.",
  Advanced: "A stronger plan with a 20% reduction target and deeper efficiency actions.",
  Custom: "A flexible plan where you set your own reduction percentage.",
};

function calculateSavingPlan(totalWaterUsagePerDay, targetReductionPercentage) {
  const usage = Number(totalWaterUsagePerDay);
  const reduction = Number(targetReductionPercentage);
  if (Number.isNaN(usage) || Number.isNaN(reduction)) return null;

  const waterToSaveLiters = (usage * reduction) / 100;
  const targetDailyUsage = usage - waterToSaveLiters;
  return {
    totalWaterUsagePerDay: usage,
    targetReductionPercentage: reduction,
    waterToSaveLiters,
    targetDailyUsage,
  };
}

export function SavingPlane() {
  const { token } = useAuth();
  const [planType, setPlanType] = useState("Basic");
  const [householdSize, setHouseholdSize] = useState(1);
  const [priorityArea, setPriorityArea] = useState("General");
  const [waterSource, setWaterSource] = useState("Municipal");
  const [customGoalPercentage, setCustomGoalPercentage] = useState(15);
  const [dailyWaterUsage, setDailyWaterUsage] = useState(null);
  const [dailyUsageLoading, setDailyUsageLoading] = useState(false);
  const [dailyUsageError, setDailyUsageError] = useState("");
  const [savedPlan, setSavedPlan] = useState(null);
  const [savedPlans, setSavedPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plansError, setPlansError] = useState("");
  const [showTips, setShowTips] = useState(false);
  const [serverCalculation, setServerCalculation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const targetReductionPercentage = useMemo(() => {
    if (planType === "Basic") return 10;
    if (planType === "Advanced") return 20;
    return Number(customGoalPercentage) || 0;
  }, [planType, customGoalPercentage]);

  const calculation = useMemo(() =>
    calculateSavingPlan(dailyWaterUsage ?? 0, targetReductionPercentage),
    [dailyWaterUsage, targetReductionPercentage]
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const loadDailyWaterUsage = async () => {
      setDailyUsageLoading(true);
      setDailyUsageError("");
      try {
        const response = await usageApi.dailyWaterUsage(token, { days: 30 });
        if (!cancelled) {
          setDailyWaterUsage(response.data?.averageDailyUsage ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setDailyUsageError(err?.message || "Unable to load daily water usage.");
          setDailyWaterUsage(0);
        }
      } finally {
        if (!cancelled) setDailyUsageLoading(false);
      }
    };

    const loadSavedPlans = async () => {
      setPlansLoading(true);
      setPlansError("");
      try {
        const response = await savingPlansApi.getAll(token);
        if (!cancelled) {
          const plans = response.savingPlans || [];
          setSavedPlans(plans);
          setSavedPlan(plans[0] || null);
        }
      } catch (err) {
        if (!cancelled) {
          setPlansError(err?.message || "Unable to load saved plans.");
          setSavedPlans([]);
          setSavedPlan(null);
        }
      } finally {
        if (!cancelled) setPlansLoading(false);
      }
    };

    const loadSavingCalculation = async () => {
      try {
        const response = await savingPlansApi.getCalculation(token);
        if (!cancelled) {
          setServerCalculation(response || null);
        }
      } catch (err) {
        if (!cancelled) {
          setServerCalculation(null);
        }
      }
    };

    loadDailyWaterUsage();
    loadSavedPlans();
    loadSavingCalculation();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSavedPlan(null);

    if (!token) {
      setError("You must be logged in to generate a saving plan.");
      return;
    }

    if (!householdSize) {
      setError("Household size is required.");
      return;
    }

    if (!dailyWaterUsage || dailyWaterUsage <= 0) {
      setError("Unable to create a saving plan because daily water usage data is not available yet.");
      return;
    }

      if (planType === "Custom" && (!customGoalPercentage || customGoalPercentage < 1 || customGoalPercentage > 100)) {
      setError("Custom goal percentage must be between 1 and 100.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        planType,
        householdSize: Number(householdSize),
        priorityArea,
        waterSource,
        customGoalPercentage: planType === "Custom" ? Number(customGoalPercentage) : undefined,
      };

      const response = await savingPlansApi.create(token, payload);
      const plan = response?.data ? response.data : response;
      setSavedPlan(plan);
      setSavedPlans((prevPlans) => [plan, ...prevPlans]);
      setServerCalculation(plan.savingCalculation || null);
      setMessage("Saving plan generated successfully.");
    } catch (err) {
      setError(err?.message || "Unable to create saving plan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 text-brand-600">
          <Sparkles className="h-6 w-6" />
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Saving Plane</h1>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Choose a plan type, generate your saving plan, and review the expected water reduction.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <Card className="space-y-6 p-6">
          {error ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}
          {message ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Plan type
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                >
                  {PLAN_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Priority area
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  value={priorityArea}
                  onChange={(e) => setPriorityArea(e.target.value)}
                >
                  {PRIORITY_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Household size
                <input
                  type="number"
                  min="1"
                  value={householdSize}
                  onChange={(e) => setHouseholdSize(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                />
              </label>

              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Water source
                <select
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900"
                  value={waterSource}
                  onChange={(e) => setWaterSource(e.target.value)}
                >
                  {WATER_SOURCES.map((source) => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </label>
            </div>

            {planType === "Custom" ? (
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                Custom goal percentage
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={customGoalPercentage}
                  onChange={(e) => setCustomGoalPercentage(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                />
              </label>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">Plan preview</div>
              <p className="mt-2">
                {dailyUsageLoading
                  ? "Loading daily usage from your activity records..."
                  : dailyUsageError
                  ? dailyUsageError
                  : `Your average daily usage is ${dailyWaterUsage ?? 0} L/day. ${planSummary[planType]}`}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Reduction</span>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{targetReductionPercentage}%</div>
                </div>
                <div>
                  <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">Expected savings</span>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{(serverCalculation?.waterToSaveLiters ?? calculation?.waterToSaveLiters)?.toFixed(0) || 0} L/day</div>
                </div>
              </div>

              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Water saving calculation</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Average use</div>
                    <div className="mt-1 text-sm text-slate-900">{(serverCalculation?.totalWaterUsagePerDay ?? calculation?.totalWaterUsagePerDay) || 0} L/day</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Target use</div>
                    <div className="mt-1 text-sm text-slate-900">{(serverCalculation?.targetDailyUsage ?? calculation?.targetDailyUsage) || 0} L/day</div>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Saved water</div>
                    <div className="mt-1 text-sm text-slate-900">{(serverCalculation?.waterToSaveLiters ?? calculation?.waterToSaveLiters) || 0} L/day</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Reduction goal</div>
                    <div className="mt-1 text-sm text-slate-900">{serverCalculation?.targetReductionPercentage ?? targetReductionPercentage}%</div>
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Generating plan..." : "Generate saving plan"}
            </Button>
          </form>
        </Card>

        <Card className="space-y-6 p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-500 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <div className="text-lg font-semibold text-slate-900">Plan details</div>
              <p className="mt-1 text-sm text-slate-600">
                Created plans appear here after you submit the form.
              </p>
            </div>
          </div>

          {plansLoading ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
              Loading saved plans...
            </div>
          ) : plansError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-100">
              {plansError}
            </div>
          ) : savedPlans.length ? (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
              Saved plans available: <span className="font-semibold text-slate-900">{savedPlans.length}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button as={Link} to="/user/usage" variant="outline" size="sm" className="gap-2">
              View usage history
            </Button>
            <Button onClick={() => setShowTips((prev) => !prev)} variant="ghost" size="sm" className="gap-2">
              {showTips ? "Hide saving tips" : "View saving tips"}
            </Button>
          </div>

          {savedPlan ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">Plan type</div>
                    <div className="mt-1 text-lg font-bold text-slate-900">{savedPlan.planType}</div>
                  </div>
                  <div className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{savedPlan.status}</div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Goal</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{savedPlan.targetReductionPercentage}% reduction</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Daily savings</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{savedPlan.savingCalculation?.waterToSaveLiters?.toFixed(0) || 0} L/day</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Water source</div>
                    <div className="mt-1 text-sm text-slate-900">{savedPlan.waterSource}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Priority area</div>
                    <div className="mt-1 text-sm text-slate-900">{savedPlan.priorityArea}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Household size</div>
                    <div className="mt-1 text-sm text-slate-900">{savedPlan.householdSize}</div>
                  </div>
                  {savedPlan.planType === "Custom" ? (
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Custom goal</div>
                      <div className="mt-1 text-sm text-slate-900">{savedPlan.customGoalPercentage}%</div>
                    </div>
                  ) : null}
                </div>

                {savedPlan.weatherData ? (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                    <div className="font-semibold text-slate-900">Weather-based watering advice</div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Location</div>
                        <div className="mt-1 text-sm text-slate-900">{savedPlan.weatherData.location || "Unknown"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Current weather</div>
                        <div className="mt-1 text-sm text-slate-900">{savedPlan.weatherData.weather || savedPlan.weatherData.description || "Unknown"}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Temperature</div>
                        <div className="mt-1 text-sm text-slate-900">{savedPlan.weatherData.temperature != null ? `${savedPlan.weatherData.temperature}°C` : "N/A"}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Advice</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{savedPlan.weatherData.gardenAdvice || "No weather advice available."}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Next steps</div>
                <ul className="mt-3 space-y-3">
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="mt-1 h-4 w-4 text-brand-600" />
                    <span>Check your household water use and adjust high-consumption activities.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <AlertTriangle className="mt-1 h-4 w-4 text-brand-600" />
                    <span>Review usage history to confirm progress over the next week.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <Button as={Link} to="/user/usage" className="w-full gap-2" size="lg">
                  Review usage history <ArrowRight className="h-4 w-4" />
                </Button>
                <Button onClick={() => setShowTips((prev) => !prev)} className="w-full gap-2" size="lg" variant="outline">
                  {showTips ? "Hide saving tips" : "Show saving tips"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">No plan generated yet</div>
              <p className="mt-3">Select a plan type and submit the form to create your saving plan.</p>
            </div>
          )}
          {showTips ? (
            <>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">Saving Tips for {savedPlan?.priorityArea || priorityArea}</div>
                <ul className="mt-4 space-y-3 list-disc pl-5">
                  {(savedPlan?.savingTips || []).length > 0 ? (
                    savedPlan.savingTips.map((tip, index) => <li key={index}>{tip}</li>)
                  ) : (
                    <li>No saving tips available yet.</li>
                  )}
                </ul>
              </div>

            </>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
