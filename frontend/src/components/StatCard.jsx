import React from "react";
import clsx from "clsx";
import { Card } from "./ui/Card";

export function StatCard({ title, value, subtitle, icon: Icon, className }) {
  return (
    <Card className={clsx("p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-600">{title}</div>
          <div className="mt-2 text-3xl font-black tracking-tight text-slate-900">{value}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {Icon ? (
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-100 to-sky-100 ring-1 ring-slate-200/70">
            <Icon className="h-6 w-6 text-brand-700" />
          </div>
        ) : null}
      </div>
    </Card>
  );
}
