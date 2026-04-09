import React, { useState } from "react";
import clsx from "clsx";
import { Card } from "./ui/Card";
import { ZoneTable } from "./ZoneTable";
import { ChevronDown, ChevronRight, Home, MapPin } from "lucide-react";

export function HouseholdCard({ household, zones, defaultOpen = false, className }) {
  const [open, setOpen] = useState(defaultOpen);
  const h = household;

  return (
    <Card className={clsx("overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-5 py-4 text-left transition hover:bg-slate-50/80"
      >
        <span className="mt-0.5 text-slate-500">
          {open ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </span>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500/15 to-sky-500/15 ring-1 ring-slate-200/70">
          <Home className="h-5 w-5 text-brand-700" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold text-slate-900">{h?.name}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {h?.propertyType || "—"}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              {zones?.length ?? 0} zone{(zones?.length ?? 0) === 1 ? "" : "s"}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4 text-slate-400" />
              {h?.location?.city}
              {h?.location?.state ? `, ${h.location.state}` : ""}
              {h?.location?.country ? ` · ${h.location.country}` : ""}
            </span>
            <span>·</span>
            <span>{h?.numberOfResidents} residents</span>
            {h?.predictedBill != null ? (
              <>
                <span>·</span>
                <span className="font-semibold text-slate-800">
                  Est. bill: {Number(h.predictedBill).toFixed(2)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </button>
      {open ? (
        <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          <ZoneTable zones={zones} />
        </div>
      ) : null}
    </Card>
  );
}
