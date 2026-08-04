/**
 * Session state.
 *
 * The stored user shape comes from the Django login endpoint:
 *   { id, username, email, first_name, last_name, user_type, profile,
 *     is_staff, is_superuser }
 *
 * Components subscribe via `useSession()` so a login or logout in one place
 * updates the navigation everywhere - previously each component read
 * localStorage once on mount and could not see changes.
 */

import { useCallback, useSyncExternalStore } from "react";

const USER_KEY = "user";
const TOKENS_KEY = "authTokens";

const listeners = new Set();
let snapshot = read();

function parse(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function roleOf(user) {
  if (!user) return "guest";
  if (user.user_type === "admin") {
    return user.profile?.is_super_admin || user.is_superuser ? "superadmin" : "admin";
  }
  return user.user_type === "student" ? "student" : "user";
}

function read() {
  const user = parse(USER_KEY);
  return {
    user,
    tokens: parse(TOKENS_KEY),
    role: roleOf(user),
    isAuthenticated: Boolean(user),
    isAdmin: roleOf(user) === "admin" || roleOf(user) === "superadmin",
    isSuperAdmin: roleOf(user) === "superadmin",
  };
}

function emit() {
  snapshot = read();
  listeners.forEach((listener) => listener());
}

export function getSession() {
  return snapshot;
}

export function getAccessToken() {
  return snapshot.tokens?.access ?? null;
}

export function getRefreshToken() {
  return snapshot.tokens?.refresh ?? null;
}

export function setSession({ user, tokens }) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (tokens) localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  emit();
  return read();
}

export function setTokens(tokens) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  emit();
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKENS_KEY);
  emit();
}

export function displayName(user) {
  if (!user) return "";
  const full = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return full || user.username || user.email || "";
}

/** Landing route for a role, used after login and by guards. */
export function homeRouteFor(role) {
  if (role === "superadmin") return "/admin/users";
  if (role === "admin") return "/admin/scholarships";
  return "/";
}

// Keep tabs in sync when the user logs out in another tab.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === USER_KEY || event.key === TOKENS_KEY) emit();
  });
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSession() {
  return useSyncExternalStore(subscribe, getSession, getSession);
}

export function useLogout() {
  return useCallback(() => clearSession(), []);
}
