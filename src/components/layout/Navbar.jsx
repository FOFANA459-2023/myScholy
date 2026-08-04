import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";

import Logo from "../../assets/Logo.jpg";
import cn from "../../lib/cn.js";
import { clearSession, displayName, useSession } from "../../lib/auth.js";
import { auth as authApi } from "../../lib/api/endpoints.js";
import { clear as clearCache } from "../../lib/cache.js";
import { Button } from "../ui/index.js";

/**
 * Navigation structure: Home, Scholarships, Services (dropdown), then the
 * role-aware dashboard link for admins, and Contact last. The service pages
 * live under one dropdown so the bar stays short as offerings grow.
 */
const SERVICE_LINKS = [
  { to: "/consulting", label: "Consulting" },
  { to: "/academy", label: "myScholy Academy" },
];

function linkClass({ isActive }) {
  return cn(
    "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
    isActive
      ? "border-white/70 bg-white/20 text-white"
      : "border-white/25 text-white/90 hover:border-white/50 hover:bg-white/10 hover:text-white",
  );
}

/**
 * Desktop "Services" dropdown. Opens on hover and on click/focus, closes on
 * outside click, Escape, hover-out, and route changes. The button reflects
 * the open state and whether a service page is the current route.
 */
function ServicesMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const rootRef = useRef(null);
  const closeTimer = useRef(null);

  const isActive = SERVICE_LINKS.some((link) => location.pathname.startsWith(link.to));

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // A small close delay lets the pointer travel from the button to the panel
  // without the menu vanishing in between.
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };
  const cancelClose = () => clearTimeout(closeTimer.current);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        cancelClose();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={cn(linkClass({ isActive }), "inline-flex items-center gap-1.5")}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        Services
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        >
          <path
            fillRule="evenodd"
            d="M5.22 7.47a.75.75 0 0 1 1.06 0L10 11.19l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.53a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-ink-200/70 bg-white py-1.5 shadow-card-hover"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          {SERVICE_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              role="menuitem"
              className={({ isActive: itemActive }) =>
                cn(
                  "block px-4 py-2.5 text-sm transition-colors",
                  itemActive
                    ? "bg-brand-50 font-medium text-brand-900"
                    : "text-ink-700 hover:bg-ink-50 hover:text-ink-900",
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, role, isAuthenticated, isAdmin, isSuperAdmin } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  useEffect(() => setIsOpen(false), [location.pathname]);

  const dashboardLabel = isSuperAdmin ? "Super Admin Dashboard" : "Admin Dashboard";

  const handleLogout = async () => {
    const refresh = JSON.parse(localStorage.getItem("authTokens") || "null")?.refresh;
    // Blacklist server-side, but never block the UI on it. The request grabs
    // the access token synchronously, so clearing the session below is safe.
    if (refresh) authApi.logout(refresh).catch(() => {});
    clearSession();
    clearCache();
    // From a public page this lands on the home page. From an admin page the
    // ProtectedRoute notices the cleared session first and wins the race to
    // /login instead - also a sensible signed-out destination, so the
    // difference is deliberately tolerated rather than fought with flushSync.
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-brand-wash shadow-lg">
      <nav className="bg-white/10 backdrop-blur-lg" aria-label="Main">
        <div className="container flex h-[4.5rem] items-center justify-between gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-3 rounded-lg"
            aria-label="MyScholy home"
          >
            <img
              src={Logo}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl object-cover"
            />
            <span className="text-xl font-bold text-white">MyScholy</span>
          </Link>

          <div className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            <NavLink to="/" end className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/scholarships" className={linkClass}>
              Scholarships
            </NavLink>
            <ServicesMenu />
            {isAdmin && (
              <NavLink to="/admin" className={linkClass}>
                {dashboardLabel}
              </NavLink>
            )}
            <NavLink to="/contact" className={linkClass}>
              Contact
            </NavLink>
          </div>

          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            {isAuthenticated ? (
              <>
                <span className="max-w-[10rem] truncate text-sm text-white/80">
                  {displayName(user)}
                  {role !== "student" && role !== "user" && (
                    <span className="ml-1 text-xs uppercase tracking-wide text-gold-200">
                      {role}
                    </span>
                  )}
                </span>
                <Button variant="onBrand" size="sm" onClick={handleLogout}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button variant="onBrand" size="sm" to="/login">
                  Log in
                </Button>
                <Button variant="gold" size="sm" to="/signup">
                  Sign up
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-white lg:hidden"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {isOpen && (
          <div id="mobile-menu" className="border-t border-white/15 lg:hidden">
            <div className="container flex flex-col gap-1.5 py-4">
              <NavLink to="/" end className={linkClass}>
                Home
              </NavLink>
              <NavLink to="/scholarships" className={linkClass}>
                Scholarships
              </NavLink>

              {/* The Services dropdown flattens into a labelled group. */}
              <p className="mt-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-white/60">
                Services
              </p>
              {SERVICE_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}

              {isAdmin && (
                <>
                  <p className="mt-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-white/60">
                    Admin
                  </p>
                  <NavLink to="/admin" className={linkClass}>
                    {dashboardLabel}
                  </NavLink>
                </>
              )}

              <NavLink
                to="/contact"
                className={(state) => cn(linkClass(state), "mt-1.5")}
              >
                Contact
              </NavLink>

              <div className="mt-2 border-t border-white/15 pt-3">
                {isAuthenticated ? (
                  <Button variant="onBrand" fullWidth onClick={handleLogout}>
                    Log out
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="onBrand" to="/login">
                      Log in
                    </Button>
                    <Button variant="gold" to="/signup">
                      Sign up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
