import React from "react";

import cn from "../../lib/cn.js";

export function Card({ as: Tag = "div", className, interactive = false, ...props }) {
  return (
    <Tag
      className={cn(
        "surface",
        interactive &&
          "transition-shadow duration-200 hover:shadow-card-hover focus-within:shadow-card-hover",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("border-b border-ink-200/70 px-5 py-4 sm:px-6", className)}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }) {
  return <div className={cn("px-5 py-5 sm:px-6", className)} {...props} />;
}

export function CardTitle({ className, as: Tag = "h2", ...props }) {
  return <Tag className={cn("text-lg font-semibold text-ink-900", className)} {...props} />;
}

const BADGE_TONES = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200",
  gold: "bg-gold-50 text-gold-800 ring-1 ring-inset ring-gold-200",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
};

export function Badge({ tone = "neutral", className, ...props }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        BADGE_TONES[tone] ?? BADGE_TONES.neutral,
        className,
      )}
      {...props}
    />
  );
}

/** Labelled value used on detail pages and dashboards. */
export function Stat({ label, value, hint, className }) {
  return (
    <div className={cn("surface px-4 py-3.5 sm:px-5 sm:py-4", className)}>
      <p className="truncate text-xs font-medium uppercase tracking-wide text-ink-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900 sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-0.5 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

export default Card;
