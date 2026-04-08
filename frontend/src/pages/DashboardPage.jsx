import React from "react";
import { Link } from "react-router-dom";
import { Droplet, LayoutDashboard } from "lucide-react";
import { Navbar, Footer } from "../components/SiteShell";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const { user, token } = useAuth();

  return (
    <div>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/70 shadow-sm">
              <LayoutDashboard className="h-4 w-4 text-brand-600" />
              Dashboard
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900">
              Welcome{user?.name ? `, ${user.name}` : ""}.
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              This is a starter dashboard page. Next, we can connect the rest of your backend modules
              (usage, saving plans, households, zones).
            </p>
          </div>
          <Button as={Link} to="/" variant="ghost">
            Back to Home
          </Button>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div className="text-sm font-extrabold text-slate-900">Auth Status</div>
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-sky-100 ring-1 ring-slate-200/70">
                <Droplet className="h-5 w-5 text-brand-700" />
              </div>
            </div>
            <div className="mt-4 text-sm text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">Token:</span>{" "}
                {token ? "stored" : "missing"}
              </div>
              <div className="mt-2">
                <span className="font-semibold text-slate-700">Profile:</span>{" "}
                {user ? "loaded" : "not loaded"}
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500">
              Note: your backend CORS headers don’t include `Authorization`, so profile calls may fail
              in the browser until that header is allowed.
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <div className="text-sm font-extrabold text-slate-900">Next steps</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Connect Usage analytics",
                "Saving plans creation + tracking",
                "Household management",
                "Zone management",
              ].map((x) => (
                <div
                  key={x}
                  className="rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200/70"
                >
                  {x}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}

