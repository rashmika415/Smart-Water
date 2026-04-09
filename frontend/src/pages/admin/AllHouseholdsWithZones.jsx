import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { HouseholdCard } from "../../components/HouseholdCard";
import { Button } from "../../components/ui/Button";

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

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            All households with zones
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Each card is a household; expand to see nested zones (relational view).
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

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
            <p className="text-sm text-slate-600">No households yet.</p>
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
