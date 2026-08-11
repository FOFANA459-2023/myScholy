/**
 * Every API call the app makes, in one place.
 *
 * Cache policy lives here rather than in components, so a screen cannot
 * accidentally hammer an endpoint that should be cached - and a mutation
 * declares which cached tags it invalidates.
 */

import { api, API_BASE_URL, ApiError, download } from "./client.js";
import { getAccessToken } from "../auth.js";

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

  /** Live scholarships similar to this one, for the detail page. */
  similar: (slug, options) =>
    api.get(`/scholarships/${slug}/similar/`, {
      cache: DETAIL_CACHE,
      auth: false,
      ...options,
    }),

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

  /** Super admin only: mark a contact message handled/unhandled. */
  setContactHandled: (id, isHandled) =>
    api.patch(`/admin/contact/${id}/`, { is_handled: isHandled }),

  /** Super admin only: email a reply to a contact message (marks it handled). */
  replyToContact: (id, payload) =>
    api.post(`/admin/contact/${id}/reply/`, payload),

  /** Super admin only: inbox grouped by sender, newest activity first. */
  conversations: (params, options) =>
    api.get("/admin/conversations/", { params, ...options }),

  /** Super admin only: one sender's full thread, oldest first. */
  conversation: (email, options) =>
    api.get(`/admin/conversations/${encodeURIComponent(email)}/`, options),

  /** Super admin only: reply to a thread (marks every message handled). */
  replyToConversation: (email, payload) =>
    api.post(`/admin/conversations/${encodeURIComponent(email)}/reply/`, payload),

  /** Super admin only: mark a whole thread handled/unhandled. */
  setConversationHandled: (email, isHandled) =>
    api.patch(`/admin/conversations/${encodeURIComponent(email)}/`, {
      is_handled: isHandled,
    }),

  /**
   * Super admin only: delete a student's messages, dropping the thread from
   * the inbox. Admin replies stay in the sent-mail history.
   */
  deleteConversation: (email) =>
    api.delete(`/admin/conversations/${encodeURIComponent(email)}/`),

  /** Super admin only: sent-mail history. */
  sentMessages: (params, options) =>
    api.get("/admin/messages/", { params, ...options }),

  /** Super admin only: compose and send a new email from the myScholy address. */
  sendMessage: (payload) => api.post("/admin/messages/", payload),
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

  // Chat and the assessment send the JWT when the visitor is logged in
  // (auth: true attaches it only if present): signed-in users get a higher
  // daily quota on the server.
  chat: (message, history) =>
    api.post(
      "/assistant/chat/",
      { message, history },
      { timeout: 35_000 },
    ),

  /** Public: personalized fit-assessment result from the quiz answers. */
  assessment: (answers) =>
    api.post(
      "/assistant/assessment/",
      { answers },
      { timeout: 45_000 },
    ),

  /** Admin-only: extract posting-form fields from pasted announcement text. */
  extractScholarship: (text) =>
    api.post(
      "/admin/assistant/extract-scholarship/",
      { text },
      { timeout: 35_000 },
    ),

  /** Admin-only: extract from a scholarship page URL (fetched server-side). */
  extractScholarshipUrl: (url) =>
    api.post(
      "/admin/assistant/extract-scholarship/",
      { url },
      { timeout: 45_000 },
    ),

  /**
   * Admin-only: extract from an uploaded PDF. Multipart, so it bypasses the
   * JSON client; Gemini reads the document natively (scans included).
   */
  extractScholarshipPdf: async (file) => {
    const form = new FormData();
    form.append("pdf", file);
    let response;
    try {
      response = await fetch(
        `${API_BASE_URL}/admin/assistant/extract-scholarship/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getAccessToken()}` },
          body: form,
        },
      );
    } catch {
      throw new ApiError(
        "We couldn't reach the server. Check your connection and try again.",
        { status: 0 },
      );
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(data?.error || `Request failed (${response.status})`, {
        status: response.status,
        data,
      });
    }
    return data;
  },
};
