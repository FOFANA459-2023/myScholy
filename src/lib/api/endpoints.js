/**
 * Every API call the app makes, in one place.
 *
 * Cache policy lives here rather than in components, so a screen cannot
 * accidentally hammer an endpoint that should be cached - and a mutation
 * declares which cached tags it invalidates.
 */

import { api, download } from "./client.js";

export const TAGS = {
  scholarships: "scholarships",
  admins: "admins",
  statistics: "statistics",
};

const MINUTE = 60_000;

// Reference data changes rarely; lists change when an admin posts something.
const LIST_CACHE = { ttl: 2 * MINUTE, maxAge: 30 * MINUTE, tags: [TAGS.scholarships] };
const DETAIL_CACHE = { ttl: 5 * MINUTE, maxAge: 60 * MINUTE, tags: [TAGS.scholarships] };
// Filter options must reflect the catalogue as it is now - a stale entry here
// offers countries and degree levels that no longer match any scholarship.
const FACET_CACHE = { ttl: 0, maxAge: 5 * MINUTE, tags: [TAGS.scholarships] };

// ---------------------------------------------------------------------------
// Scholarships
// ---------------------------------------------------------------------------

export const scholarships = {
  list: (params, options) =>
    api.get("/scholarships/", { params, cache: LIST_CACHE, auth: false, ...options }),

  detail: (id, options) =>
    api.get(`/scholarships/${id}/`, { cache: DETAIL_CACHE, auth: false, ...options }),

  facets: (options) =>
    api.get("/scholarships/facets/", { cache: FACET_CACHE, auth: false, ...options }),

  adminList: (params, options) =>
    api.get("/admin/scholarships/", { params, cache: LIST_CACHE, ...options }),

  adminDetail: (id, options) => api.get(`/admin/scholarships/${id}/`, options),

  create: (payload) =>
    api.post("/admin/scholarships/", payload, {
      invalidates: [TAGS.scholarships, TAGS.statistics],
    }),

  update: (id, payload) =>
    api.put(`/admin/scholarships/${id}/`, payload, {
      invalidates: [TAGS.scholarships, TAGS.statistics],
    }),

  remove: (id) =>
    api.delete(`/admin/scholarships/${id}/`, {
      invalidates: [TAGS.scholarships, TAGS.statistics],
    }),

  /** Return an archived scholarship to the live board. The server rejects it
   *  with a clear message if the deadline has already passed. */
  repost: (id) =>
    api.post(`/admin/scholarships/${id}/repost/`, undefined, {
      invalidates: [TAGS.scholarships, TAGS.statistics],
    }),

  exportCsv: () => download("/admin/scholarships/export/", "scholarships.csv"),
};

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

export const auth = {
  login: (identifier, password) =>
    api.post("/auth/login/", { username: identifier, password }, { auth: false }),

  registerStudent: (payload) =>
    api.post("/auth/student/register/", payload, { auth: false }),

  logout: (refresh) => api.post("/auth/logout/", { refresh }),

  profile: (options) => api.get("/auth/profile/", options),

  requestPasswordReset: (email) =>
    api.post("/auth/password-reset/", { email }, { auth: false }),

  confirmPasswordReset: ({ uid, token, newPassword }) =>
    api.post(
      "/auth/password-reset/confirm/",
      { uid, token, new_password: newPassword },
      { auth: false },
    ),
};

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export const admin = {
  // Management screens poll these; the client cache would only serve back the
  // same snapshot the poll is trying to replace. The backend's versioned cache
  // (invalidated by model signals) keeps the queries cheap.
  statistics: (options) => api.get("/admin/statistics/", options),

  users: (options) => api.get("/admins/", options),

  /**
   * Paginated, searchable roster of every account (the on-screen users CSV).
   * Deliberately NOT given a `cache` config: personal data must never sit in
   * sessionStorage, and the server already marks it `private, no-store`.
   */
  userDirectory: (params, options) => api.get("/admin/users/", { params, ...options }),

  createUser: (payload) =>
    api.post("/admins/", payload, { invalidates: [TAGS.admins, TAGS.statistics] }),

  updateUser: (userId, payload) =>
    api.patch(`/admins/${userId}/`, payload, { invalidates: [TAGS.admins] }),

  deleteUser: (userId, { soft = false } = {}) =>
    api.delete(`/admins/${userId}/`, {
      params: soft ? { soft: "true" } : undefined,
      invalidates: [TAGS.admins, TAGS.statistics],
    }),

  exportUsersCsv: () => download("/admin/users/export/", "users.csv"),

  contactMessages: (params, options) =>
    api.get("/admin/contact/", { params, ...options }),
};

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

export const contact = {
  send: (payload) => api.post("/contact/", payload, { auth: false }),
};

/**
 * Popup site assistant. `status` decides whether the widget renders at all
 * (the backend reports disabled when no Gemini key is configured - notably in
 * the e2e stack); `chat` is one conversation turn. Chat responses are never
 * cached - each answer is specific to the question.
 */
export const assistant = {
  status: (options) =>
    api.get("/assistant/", {
      auth: false,
      cache: { ttl: 5 * 60_000, tags: ["assistant"] },
      ...options,
    }),

  chat: (message, history) =>
    api.post(
      "/assistant/chat/",
      { message, history },
      { auth: false, timeout: 35_000 },
    ),
};
