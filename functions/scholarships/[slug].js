/**
 * Per-scholarship social previews.
 *
 * Facebook/WhatsApp/Twitter crawlers don't run JavaScript, so the SPA's
 * index.html gave every shared scholarship link the same generic preview.
 * This Pages Function serves /scholarships/<slug> with the scholarship's own
 * name and description injected into the <title>/OpenGraph tags. Browsers get
 * the exact same document (plus the better tags) and the React app boots as
 * usual; only the crawler-visible metadata changes.
 *
 * If the API call fails or the slug is unknown, the untouched index.html is
 * served so the page always renders.
 */

const API = "https://myscholy.duckdns.org/api";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function summarize(text) {
  const flat = String(text || "").replace(/\s+/g, " ").trim();
  return flat.length > 200 ? `${flat.slice(0, 197)}...` : flat;
}

function setTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

export async function onRequestGet({ request, params, env }) {
  const origin = new URL(request.url).origin;
  const asset = await env.ASSETS.fetch(new URL("/", origin));
  let html = await asset.text();

  try {
    const response = await fetch(
      `${API}/scholarships/${encodeURIComponent(params.slug)}/`,
      { headers: { accept: "application/json" } },
    );
    if (response.ok) {
      const scholarship = await response.json();
      const title = escapeHtml(`${scholarship.name} | myScholy`);
      const description = escapeHtml(
        summarize(scholarship.description) ||
          `Apply for ${scholarship.name} - deadlines, eligibility and benefits on myScholy.`,
      );
      const url = escapeHtml(`${origin}/scholarships/${scholarship.slug}`);

      html = setTag(html, /<title>[^<]*<\/title>/, `<title>${title}</title>`);
      html = setTag(
        html,
        /(<meta[^>]*name="description"[^>]*content=")[^"]*(")/,
        `$1${description}$2`,
      );
      html = setTag(
        html,
        /(<meta[^>]*property="og:type"[^>]*content=")[^"]*(")/,
        "$1article$2",
      );
      html = setTag(
        html,
        /(<meta[^>]*property="og:title"[^>]*content=")[^"]*(")/,
        `$1${title}$2`,
      );
      html = setTag(
        html,
        /(<meta[^>]*property="og:description"[^>]*content=")[^"]*(")/,
        `$1${description}$2`,
      );
      html = setTag(
        html,
        /(<meta[^>]*property="og:url"[^>]*content=")[^"]*(")/,
        `$1${url}$2`,
      );
      // Each scholarship gets its own generated card (name + key facts on
      // the brand background), rendered by the backend.
      html = setTag(
        html,
        /(<meta[^>]*property="og:image"[^>]*content=")[^"]*(")/,
        `$1${escapeHtml(`${API}/scholarships/${scholarship.slug}/card.png`)}$2`,
      );
    }
  } catch {
    // Network hiccup to the API: fall through to the generic page.
  }

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // Edge-cache briefly so crawler bursts don't hammer the API; browsers
      // always revalidate.
      "cache-control": "public, max-age=0, s-maxage=300",
    },
  });
}
