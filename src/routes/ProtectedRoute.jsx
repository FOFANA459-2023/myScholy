import React from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { homeRouteFor, useSession } from "../lib/auth.js";

/**
 * Route guard.
 *
 * The admin screens previously did their own localStorage check inside a
 * useEffect, which meant the protected markup rendered for a frame before the
 * redirect - and routes like /post-scholarship had no check at all, so anyone
 * could open them by typing the URL.
 *
 * @param {'authenticated'|'admin'|'superadmin'} require
 */
export default function ProtectedRoute({ require = "authenticated", children }) {
  const session = useSession();
  const location = useLocation();

  const allowed =
    require === "superadmin"
      ? session.isSuperAdmin
      : require === "admin"
        ? session.isAdmin
        : session.isAuthenticated;

  if (!session.isAuthenticated) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowed) {
    return <Navigate to="/access-denied" replace />;
  }

  return children ?? <Outlet />;
}

/** Keeps signed-in users off the login/signup screens. */
export function GuestOnlyRoute({ children }) {
  const session = useSession();
  const location = useLocation();

  if (session.isAuthenticated) {
    // Race note: LoginPage also navigates after setSession(). Both paths must
    // agree on the destination, so the fallback is the role home (admins to
    // their dashboard), not "/".
    const target = location.state?.from?.pathname || homeRouteFor(session.role);
    return <Navigate to={target} replace />;
  }

  return children ?? <Outlet />;
}
