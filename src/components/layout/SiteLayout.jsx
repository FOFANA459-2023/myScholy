import React, { Suspense, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router";

import cn from "../../lib/cn.js";
import { PageLoader } from "../ui/index.js";
import Footer from "./Footer.jsx";
import Navbar from "./Navbar.jsx";

/**
 * Reset scroll position on navigation - React Router keeps it by default.
 *
 * A hash target wins over the top of the page, so links like `/#faq` land on
 * the section rather than scrolling past it. The lookup is deferred a frame
 * because the target section may be inside a lazy route that has not painted
 * yet at the moment the location changes.
 */
function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }

    let frame = 0;
    let cancelled = false;
    // Bounded on both counts: a hash pointing at nothing (an old link, a typo)
    // must give up rather than spin forever, and the re-alignment below has to
    // stop even if the page never stops moving.
    const deadline = performance.now() + 1500;

    // Images above the target load after the first jump and push it down the
    // page, so a single scrollIntoView lands short. Re-align until the target
    // holds its position across a few frames. Instant, not smooth: repeated
    // smooth scrolls fight each other and never converge.
    let stableFrames = 0;
    const settle = () => {
      if (cancelled) return;

      const target = document.querySelector(hash);
      if (target) {
        // Sections set scroll-margin-top so they clear the sticky header, so
        // "arrived" is that offset from the top of the viewport, not zero.
        const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const top = target.getBoundingClientRect().top;
        if (Math.abs(top - margin) <= 2) stableFrames += 1;
        else {
          stableFrames = 0;
          target.scrollIntoView({ behavior: "instant", block: "start" });
        }
        if (stableFrames >= 3) return;
      }

      if (performance.now() < deadline) frame = requestAnimationFrame(settle);
    };

    // A deliberate scroll by the reader outranks our correction.
    const stop = () => {
      cancelled = true;
    };
    window.addEventListener("wheel", stop, { once: true, passive: true });
    window.addEventListener("touchmove", stop, { once: true, passive: true });
    window.addEventListener("keydown", stop, { once: true });

    frame = requestAnimationFrame(settle);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", stop);
    };
  }, [pathname, hash]);

  return null;
}

export default function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-brand-900"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Navbar />
      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

/** Standard page wrapper: constrained width, consistent vertical rhythm. */
export function Page({ className, children, width = "default" }) {
  return (
    <div className="bg-ink-50 py-10 sm:py-12">
      <div
        className={cn(
          "container",
          width === "narrow" && "max-w-3xl",
          width === "wide" && "max-w-7xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions, back, className }) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {back && (
          <Link
            to={back.to}
            className="mb-2 inline-flex items-center gap-1 rounded text-sm font-medium text-brand-700 transition-colors hover:text-brand-900"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 0 1-.02 1.06L9.06 10l3.71 3.71a.75.75 0 1 1-1.04 1.08l-4.5-4.25a.75.75 0 0 1 0-1.08l4.5-4.25a.75.75 0 0 1 1.06.02Z"
                clipRule="evenodd"
              />
            </svg>
            {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-ink-500">{description}</p>}
      </div>
      {/* Action buttons: full-width stack on phones, one tidy row that never
          crowds the title from sm upwards. */}
      {actions && (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
