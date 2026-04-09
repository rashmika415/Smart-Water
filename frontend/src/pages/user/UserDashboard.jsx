import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { householdsApi } from "../../lib/api";
import { StatCard } from "../../components/StatCard";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Building2, Receipt, Droplets, Gauge, ArrowRight } from "lucide-react";

export function UserDashboard() {
  const { token, user } = useAuth();
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

  const summary = useMemo(() => {
    const totalHouseholds = households.length;
    const liters = households.reduce((a, h) => a + Number(h.estimatedMonthlyLiters || 0), 0);
    const units = households.reduce((a, h) => a + Number(h.estimatedMonthlyUnits || 0), 0);
    const bill = households.reduce((a, h) => a + Number(h.predictedBill || 0), 0);
    return { totalHouseholds, liters, units, bill };
  }, [households]);

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-black tracking-tight text-slate-900">
        Welcome{user?.name ? `, ${user.name}` : ""}.
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Quick overview of your households, estimated usage, bill, and climate impact.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total households" value={summary.totalHouseholds} subtitle="Registered by you" icon={Building2} />
        <StatCard title="Estimated liters" value={summary.liters.toLocaleString()} subtitle="Monthly total" icon={Droplets} />
        <StatCard title="Estimated units" value={summary.units.toFixed(2)} subtitle="m^3 monthly total" icon={Gauge} />
        <StatCard title="Predicted bill" value={summary.bill.toFixed(2)} subtitle="Monthly estimate" icon={Receipt} />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { to: "/user/profile", title: "View Profile", body: "View and update account details." },
          { to: "/user/households", title: "My Households", body: "Manage your households and zones." },
          { to: "/user/estimated-bill", title: "Estimated Bill", body: "Understand billing calculations." },
          { to: "/user/saving-plane", title: "Saving Plane", body: "Track and manage your saving plan." },
          { to: "/user/weather-insights", title: "Weather Insights", body: "See climate zone effects." },
        ].map((x) => (
          <Card key={x.to} className="p-6">
            <div className="text-base font-extrabold text-slate-900">{x.title}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{x.body}</p>
            <Button as={Link} to={x.to} className="mt-5 w-full gap-2" size="lg">
              Open <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>

      {loading ? <p className="mt-6 text-sm text-slate-500">Loading latest household summary...</p> : null}
    </div>
  );
}
