/**
 * HTTP client for the MyScholy API.
 *
 * Responsibilities, all of which used to be duplicated (or missing) in every
 * component that called `fetch` or the Supabase SDK directly:
 *
 *  - attaches the JWT and transparently refreshes it once on a 401
 *  - de-duplicates concurrent identical GETs into a single network request
 *  - serves cached responses, with stale-while-revalidate
 *  - surfaces a consistent ApiError with field-level validation messages
 *  - supports AbortSignal so unmounted screens stop their in-flight work
 */

import * as cache from "../cache.js";
import { clearSession, getAccessToken, getRefreshToken, setTokens } from "../auth.js";

const RAW_BASE = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000/api";
export const API_BASE_URL = RAW_BASE.replace(/\/+$/, "");

const DEFAULT_TIMEOUT = 20_000;

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, fieldErrors = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.fieldErrors = fieldErrors;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isAuthError() {
    return this.status === 401 || this.status === 403;
  }
}

function buildUrl(path, params) {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  if (!params) return url;

  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === false) return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

/**
 * Turn a DRF error body into a readable message plus per-field errors.
 *
 * Nested serializers report under the parent key - registration posts a
 * `user` object, so a duplicate email arrives as
 * `{"user": {"email": ["..."]}}`. The nested shape is preserved rather than
 * joined into one string, so the form can attach the message to the email
 * field instead of to a `user` key that nothing renders.
 */
function parseErrorBody(status, body) {
  if (!body || typeof body !== "object") {
    return { message: `Request failed (${status})`, fieldErrors: null };
  }
  if (typeof body.error === "string") return { message: body.error, fieldErrors: null };
  if (typeof body.detail === "string") return { message: body.detail, fieldErrors: null };

  const toText = (value) =>
    Array.isArray(value) ? value.filter(Boolean).join(" ") : String(value);

  const fieldErrors = {};
  for (const [field, value] of Object.entries(body)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      fieldErrors[field] = Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [key, toText(nested)]),
      );
    } else {
      fieldErrors[field] = toText(value);
    }
  }

  // The banner shows the first message, so reach into a nested group for a
  // readable string rather than printing "[object Object]".
  const firstValue = Object.values(fieldErrors)[0];
  const first =
    firstValue && typeof firstValue === "object"
      ? Object.values(firstValue)[0]
      : firstValue;

  return {
    message: first || `Request failed (${status})`,
    fieldErrors: Object.keys(fieldErrors).length ? fieldErrors : null,
  };
}

async function readBody(response) {
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    return response.json().catch(() => null);
  }
  return response.text().catch(() => null);
}

// ---------------------------------------------------------------------------
// Token refresh - collapse concurrent 401s into one refresh call
// ---------------------------------------------------------------------------

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const refresh = getRefreshToken();
  if (!refresh) return null;

  refreshPromise = fetch(buildUrl("/auth/token/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("refresh failed");
      const data = await response.json();
      // ROTATE_REFRESH_TOKENS is on, so the server may hand back a new one.
      setTokens({ access: data.access, refresh: data.refresh || refresh });
      return data.access;
    })
    .catch(() => {
      clearSession();
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

const inFlight = new Map();

/**
 * Let a caller stop waiting on a shared request without cancelling it.
 *
 * De-duplicated GETs are shared between callers, so the underlying fetch must
 * never be tied to one caller's AbortSignal - otherwise a single unmount (or
 * React StrictMode's double-invoked effect in development) aborts the request
 * that every other caller is also waiting on. The shared request always runs
 * to completion and populates the cache; only this wrapper rejects early.
 */
function abortable(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(
      Object.assign(new Error("Aborted"), { name: "AbortError" }),
    );
  }

  return new Promise((resolve, reject) => {
    const onAbort = () =>
      reject(Object.assign(new Error("Aborted"), { name: "AbortError" }));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => {
      signal.removeEventListener("abort", onAbort);
    });
  });
}

async function performRequest(url, { method, body, auth, signal, timeout, retryOn401 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const onAbort = () => controller.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = auth ? getAccessToken() : null;
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "We could not reach the server. Check your connection and try again.",
      { status: 0 },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  if (response.status === 401 && auth && retryOn401) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      return performRequest(url, {
        method,
        body,
        auth,
        signal,
        timeout,
        retryOn401: false,
      });
    }
  }

  const data = await readBody(response);

  if (!response.ok) {
    const { message, fieldErrors } = parseErrorBody(response.status, data);
    throw new ApiError(message, { status: response.status, data, fieldErrors });
  }

  return data;
}

/**
 * Make a request.
 *
 * @param {string} path
 * @param {object} options
 * @param {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'} [options.method]
 * @param {object} [options.params]     query string values
 * @param {object} [options.body]       JSON body
 * @param {boolean} [options.auth]      send the bearer token (default true)
 * @param {AbortSignal} [options.signal]
 * @param {object|false} [options.cache] `{ ttl, maxAge, tags }`; GET only
 * @param {string[]} [options.invalidates] cache tags to drop after a write
 */
export async function request(path, options = {}) {
  const {
    method = "GET",
    params,
    body,
    auth = true,
    signal,
    timeout = DEFAULT_TIMEOUT,
    cache: cacheOptions,
    invalidates,
  } = options;

  const url = buildUrl(path, params);
  const isCacheable = method === "GET" && cacheOptions !== false && Boolean(cacheOptions);
  const cacheKey = isCacheable ? `${auth ? "auth" : "anon"}:${url}` : null;

  if (cacheKey) {
    const hit = cache.get(cacheKey);
    if (hit && !hit.stale) return hit.value;

    if (hit?.stale) {
      // Serve immediately, refresh in the background.
      revalidate(url, cacheKey, { auth, timeout, cacheOptions });
      return hit.value;
    }
  }

  // Collapse identical concurrent GETs (e.g. two components mounting at once).
  if (method === "GET") {
    const dedupeKey = `${auth ? "auth" : "anon"}:${url}`;
    let promise = inFlight.get(dedupeKey);

    if (!promise) {
      // Deliberately no `signal` here - see abortable() above.
      promise = performRequest(url, { method, body, auth, timeout, retryOn401: true })
        .then((data) => {
          if (cacheKey) cache.set(cacheKey, data, cacheOptions);
          return data;
        })
        .finally(() => inFlight.delete(dedupeKey));

      inFlight.set(dedupeKey, promise);
      // Nothing is attached yet if the caller aborts immediately; swallow the
      // rejection here so it never surfaces as an unhandled promise rejection.
      promise.catch(() => {});
    }

    return abortable(promise, signal);
  }

  const data = await performRequest(url, {
    method,
    body,
    auth,
    signal,
    timeout,
    retryOn401: true,
  });

  if (invalidates?.length) cache.invalidateTags(invalidates);
  return data;
}

function revalidate(url, cacheKey, { auth, timeout, cacheOptions }) {
  if (inFlight.has(cacheKey)) return;
  const promise = performRequest(url, {
    method: "GET",
    auth,
    timeout,
    retryOn401: true,
  })
    .then((data) => cache.set(cacheKey, data, cacheOptions))
    .catch(() => {
      /* keep serving the stale value */
    })
    .finally(() => inFlight.delete(cacheKey));
  inFlight.set(cacheKey, promise);
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

/**
 * Download an authenticated file (CSV exports) without leaving the page.
 *
 * The server names each export (e.g. ``scholarships_export_2026-08-04.csv``)
 * via Content-Disposition; the ``filename`` argument is only the fallback if
 * that header is missing.
 */
export async function download(path, filename) {
  const response = await fetch(buildUrl(path), {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!response.ok) {
    throw new ApiError("Export failed. Please try again.", { status: response.status });
  }
  const disposition = response.headers.get("Content-Disposition") || "";
  const serverName = disposition.match(/filename="?([^";]+)"?/)?.[1];
  if (serverName) filename = serverName;
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
