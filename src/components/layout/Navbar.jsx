import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";

import Logo from "../../assets/Logo.jpg";
import cn from "../../lib/cn.js";
import { clearSession, displayName, useSession } from "../../lib/auth.js";
import { auth as authApi } from "../../lib/api/endpoints.js";
import { clear as clearCache } from "../../lib/cache.js";
import { Button } from "../ui/index.js";

const PUBLIC_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/scholarships", label: "Scholarships" },
  // "Book us" promised something the page cannot deliver yet.
  { to: "/consulting", label: "Consulting" },
  { to: "/academy", label: "myScholy Academy" },
  { to: "/contact", label: "Contact" },
];

const ADMIN_LINKS = [
  { to: "/admin/scholarships", label: "Manage" },
  { to: "/admin/scholarships/new", label: "Post" },
];

const SUPER_ADMIN_LINKS = [{ to: "/admin/users", label: "Users" }];

function linkClass({ isActive }) {
  return cn(
    "rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
    isActive
      ? "border-white/70 bg-white/20 text-white"
      : "border-white/25 text-white/90 hover:border-white/50 hover:bg-white/10 hover:text-white",
  );
}

export default function Navbar() {
  const { user, role, isAuthenticated, isAdmin, isSuperAdmin } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close the mobile menu whenever the route changes.
  useEffect(() => setIsOpen(false), [location.pathname]);

  const links = [
    ...PUBLIC_LINKS,
    ...(isAdmin ? ADMIN_LINKS : []),
    ...(isSuperAdmin ? SUPER_ADMIN_LINKS : []),
  ];

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
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
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
              {links.map((link) => (
                <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
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
