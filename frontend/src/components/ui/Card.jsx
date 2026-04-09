import React from "react";
import clsx from "clsx";

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        "rounded-2xl bg-white/70 backdrop-blur-xl ring-1 ring-slate-200/70 shadow-soft",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

