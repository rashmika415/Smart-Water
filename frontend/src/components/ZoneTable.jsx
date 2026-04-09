import React from "react";
import clsx from "clsx";

export function ZoneTable({ zones, className }) {
  if (!zones?.length) {
    return (
      <div className={clsx("rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500", className)}>
        No zones for this household.
      </div>
    );
  }

  return (
    <div className={clsx("overflow-x-auto rounded-xl ring-1 ring-slate-200/80", className)}>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
          <tr>
            <th className="px-4 py-3">Zone name</th>
            <th className="px-4 py-3">Notes</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {zones.map((z) => (
            <tr key={z._id} className="hover:bg-slate-50/80">
              <td className="px-4 py-3 font-medium text-slate-900">{z.zoneName}</td>
              <td className="px-4 py-3 text-slate-600">{z.notes || "—"}</td>
              <td className="px-4 py-3 text-slate-500">
                {z.createdAt ? new Date(z.createdAt).toLocaleDateString() : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
