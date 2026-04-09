import React from "react";
import clsx from "clsx";

export function Button({
  as: Comp = "button",
  className,
  variant = "primary",
  size = "md",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-60 disabled:pointer-events-none";

  const variants = {
    primary:
      "bg-gradient-to-r from-brand-500 to-sky-500 text-white shadow-soft hover:shadow-glow hover:brightness-[1.02]",
    ghost:
      "bg-white/70 text-slate-900 ring-1 ring-slate-200/70 hover:bg-white hover:ring-slate-200 shadow-sm",
    dark:
      "bg-slate-900 text-white shadow-soft hover:bg-slate-800",
  };

  const sizes = {
    sm: "h-10 px-5 text-sm",
    md: "h-11 px-6 text-sm",
    lg: "h-12 px-7 text-base",
  };

  return (
    <Comp
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}

