/**
 * Shared form validation.
 *
 * Every form previously carried its own copy of the email regex and its own
 * wording for the same failure, so "Enter a valid email address" and "That
 * doesn't look like a valid email - check for typos" both existed. The rules
 * live here once, phrased consistently: say what to do next, never name the
 * rule that failed.
 *
 * These checks mirror the DRF serializers - they exist to give instant
 * feedback while typing, not to secure anything. The backend re-validates
 * every field regardless of what the browser sends.
 */

// Deliberately loose. A stricter pattern rejects valid addresses (plus tags,
// new TLDs, sub-domains) far more often than it catches real typos, and the
// backend's EmailField is the authority.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s\-()]{7,20}$/;
const NAME_RE = /^[^\d<>@]{1,60}$/;
const URL_RE = /^https?:\/\/\S+$/i;

export const required = (value, label) =>
  String(value ?? "").trim() ? undefined : `Enter your ${label}.`;

export const requiredField = (value, label) =>
  String(value ?? "").trim() ? undefined : `${label} is required.`;

export function name(value, label) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return `Enter your ${label}.`;
  if (!NAME_RE.test(trimmed)) {
    return `Enter a valid ${label} - letters only, no digits or symbols.`;
  }
  return undefined;
}

export function email(value, { label = "email address" } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return `Enter your ${label}.`;
  if (!EMAIL_RE.test(trimmed)) {
    return "That doesn't look like a valid email address - check for typos.";
  }
  return undefined;
}

/** Optional field: only validated once something has been typed. */
export function phone(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  if (!PHONE_RE.test(trimmed)) return "Enter a phone number like +231 770 123 456.";
  return undefined;
}

export function password(value) {
  const raw = String(value ?? "");
  if (!raw) return "Choose a password.";
  if (raw.length < 8) return "Your password needs at least 8 characters.";
  if (/^\d+$/.test(raw)) {
    return "Passwords can't be only numbers - add letters too.";
  }
  return undefined;
}

export function passwordConfirmation(value, original) {
  if (!String(value ?? "")) return "Re-enter your password to confirm it.";
  if (value !== original) return "These passwords don't match - please retype them.";
  return undefined;
}

export function url(value, { label = "URL" } = {}) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return `${label} is required.`;
  if (!URL_RE.test(trimmed)) {
    return "Enter the full address, starting with https://";
  }
  return undefined;
}

export function minLength(value, length, message) {
  return String(value ?? "").trim().length < length ? message : undefined;
}

export function maxLength(value, length, message) {
  return String(value ?? "").length > length ? message : undefined;
}

export function choice(value, allowed, message) {
  return allowed.includes(String(value ?? "")) ? undefined : message;
}

/**
 * Drop the undefined entries a rule map produces, so callers can write the
 * checks declaratively and still get "is the form valid?" from the key count.
 */
export function collect(candidates) {
  return Object.fromEntries(
    Object.entries(candidates).filter(([, message]) => Boolean(message)),
  );
}

/**
 * DRF reports nested serializer failures under the parent key, e.g.
 * `{"user": {"email": ["..."]}}`, which the API client flattens to
 * `fieldErrors.user`. Signup posts a nested `user` object, so without this the
 * duplicate-email message lands on a key no field renders and the form looks
 * like it silently did nothing.
 */
export function flattenFieldErrors(fieldErrors, nestedKey = "user") {
  if (!fieldErrors) return {};
  const { [nestedKey]: nested, ...rest } = fieldErrors;
  if (!nested) return rest;
  if (typeof nested === "object") return { ...rest, ...nested };
  return { ...rest, [nestedKey]: nested };
}
