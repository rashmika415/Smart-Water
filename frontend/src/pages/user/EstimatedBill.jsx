import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { Card } from "../../components/ui/Card";

export function EstimatedBill() {
  const { token } = useAuth();
  const [households, setHouseholds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await householdsApi.myHouseholds(token);
        if (!cancelled) setHouseholds(Array.isArray(data) ? data : []);
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

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">Estimated water bill</h1>
      <p className="mt-1 text-sm text-slate-600">
        Bill is estimated using household residents, climate factor, and monthly unit rate.
      </p>

      <Card className="mt-6 overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3">Household</th>
                <th className="px-4 py-3">Liters</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Climate zone</th>
                <th className="px-4 py-3">Predicted bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Loading...</td></tr>
              ) : households.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No households yet.</td></tr>
              ) : (
                households.map((h) => (
                  <tr key={h._id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{h.name}</td>
                    <td className="px-4 py-3">{Number(h.estimatedMonthlyLiters || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">{Number(h.estimatedMonthlyUnits || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">{h.climateZone || "Unknown"}</td>
                    <td className="px-4 py-3 font-semibold">{Number(h.predictedBill || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-brand-100">
        Total estimated monthly bill: <span className="font-bold">{total.toFixed(2)}</span>
      </div>
    </div>
  );
}
