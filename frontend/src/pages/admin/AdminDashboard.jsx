import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { usersApi, householdsApi } from "../../lib/api";
import { StatCard } from "../../components/StatCard";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Users, Building2, Layers3, Receipt, ArrowRight } from "lucide-react";

export function AdminDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalHouseholds: 0,
    totalZones: 0,
    avgPredictedBill: 0,
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError("");
      setLoading(true);
      try {
        const [users, hhPage, withZones] = await Promise.all([
          usersApi.list(token),
          householdsApi.list(token, { page: 1, limit: 500, search: "" }),
          householdsApi.allWithZones(token),
        ]);
        if (cancelled) return;

        const households = hhPage?.households || [];
        const totalHouseholds = typeof hhPage?.total === "number" ? hhPage.total : households.length;
        const bills = households
          .map((h) => h.predictedBill)
          .filter((n) => n != null && !Number.isNaN(Number(n)));
        const avg =
          bills.length > 0 ? bills.reduce((a, b) => a + Number(b), 0) / bills.length : 0;

        const zoneCount = Array.isArray(withZones)
          ? withZones.reduce((acc, row) => acc + (row.zones?.length || 0), 0)
          : 0;

        setStats({
          totalUsers: Array.isArray(users) ? users.length : 0,
          totalHouseholds,
          totalZones: zoneCount,
          avgPredictedBill: avg,
        });
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-600">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Admin dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          System overview and quick access to management tools.
        </p>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-rose-100">
          {error}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total users"
          value={stats.totalUsers.toLocaleString()}
          subtitle="Registered accounts"
          icon={Users}
        />
        <StatCard
          title="Total households"
          value={stats.totalHouseholds.toLocaleString()}
          subtitle="Across all users"
          icon={Building2}
        />
        <StatCard
          title="Total zones"
          value={stats.totalZones.toLocaleString()}
          subtitle="All zone records"
          icon={Layers3}
        />
        <StatCard
          title="Avg. predicted bill"
          value={stats.avgPredictedBill ? stats.avgPredictedBill.toFixed(2) : "0.00"}
          subtitle="From loaded household sample (up to 500)"
          icon={Receipt}
        />
      </div>

      <div className="mt-10">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500">Quick navigation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="text-base font-extrabold text-slate-900">Manage users</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Search, view, update, and delete user accounts.
            </p>
            <Button as={Link} to="/admin/users" className="mt-5 w-full gap-2" size="lg">
              Open <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
          <Card className="p-6">
            <div className="text-base font-extrabold text-slate-900">Manage households</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Browse all households with search and pagination.
            </p>
            <Button as={Link} to="/admin/households" className="mt-5 w-full gap-2" size="lg">
              Open <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
          <Card className="p-6">
            <div className="text-base font-extrabold text-slate-900">Households &amp; zones</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              See every household with nested zones in one view.
            </p>
            <Button as={Link} to="/admin/households-zones" className="mt-5 w-full gap-2" size="lg">
              Open <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
