import React from "react";

import cn from "../../lib/cn.js";
import Button from "./Button.jsx";

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

const ALERT_TONES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-red-200 bg-red-50 text-red-800",
  info: "border-brand-200 bg-brand-50 text-brand-900",
  warning: "border-gold-300 bg-gold-50 text-gold-800",
};

export function Alert({ tone = "info", title, children, className, onDismiss }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        ALERT_TONES[tone] ?? ALERT_TONES.info,
        className,
      )}
    >
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export function Spinner({ className, label = "Loading" }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700",
        className,
      )}
    />
  );
}

export function Skeleton({ className, style }) {
  return <span className={cn("skeleton block", className)} style={style} aria-hidden="true" />;
}

/** Card-shaped placeholder that matches ScholarshipCard's real dimensions, so
 *  the layout does not shift when data arrives. `style` may carry a
 *  `--skeleton-delay` custom property; the children inherit it. */
export function CardSkeleton({ style }) {
  return (
    <div className="surface p-5" style={style}>
      <Skeleton className="h-5 w-4/5" />
      <Skeleton className="mt-3 h-3 w-2/5" />
      <div className="mt-5 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="mt-6 h-9 w-28 rounded-lg" />
    </div>
  );
}

/** Placeholder cards whose pulses ripple across the grid as a wave, rather
 *  than every card blinking at once. */
export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} style={{ "--skeleton-delay": `${index * 140}ms` }} />
      ))}
    </div>
  );
}

/** Three brand-coloured dots hopping in sequence, with a short message.
 *  Friendlier than a bare spinner, and no gradient ever sweeps the page. */
export function LoadingDots({ label = "Loading", className }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex items-center justify-center gap-1.5 py-4", className)}
    >
      {["bg-brand-700", "bg-brand-400", "bg-gold-500"].map((color, index) => (
        <span
          key={color}
          className={cn("h-2.5 w-2.5 rounded-full animate-bounce-dot", color)}
          style={{ animationDelay: `${index * 160}ms` }}
        />
      ))}
      <span className="ml-2 text-sm font-medium text-ink-500">{label}</span>
    </div>
  );
}

/**
 * Indeterminate bar for route transitions.
 *
 * Shown while a lazily-loaded page is fetched, so a click gets immediate
 * feedback at the top of the viewport instead of the page going blank or a
 * highlight sweeping across it.
 */
export function RouteProgress({ label = "Loading page" }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-brand-100/70"
    >
      <div className="h-full w-1/3 animate-progress-slide rounded-full bg-gradient-to-r from-brand-700 via-brand-500 to-gold-400" />
    </div>
  );
}

export function PageLoader({ label = "Loading" }) {
  return (
    <>
      <RouteProgress label={label} />
      {/* Holds the scroll position steady while the next page resolves. */}
      <div className="min-h-[50vh]" />
    </>
  );
}

// ---------------------------------------------------------------------------
// Empty / error states
// ---------------------------------------------------------------------------

export function EmptyState({ title, description, action, icon }) {
  return (
    <div className="surface flex flex-col items-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-ink-500">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const message =
    error?.isNetworkError
      ? "We couldn't reach the server. Check your connection and try again."
      : error?.message || "Something went wrong.";

  return (
    <EmptyState
      title="That didn't load"
      description={message}
      action={
        onRetry ? (
          <Button onClick={onRetry} variant="outline">
            Try again
          </Button>
        ) : null
      }
      icon={
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-6 w-6">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          />
        </svg>
      }
    />
  );
}
