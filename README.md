# MyScholy — Frontend

React + Vite + Tailwind client for the MyScholy scholarship board.

```bash
npm install
cp .env.example .env       # point VITE_BACKEND_URL at the Django API
npm run dev
```

The app talks only to the Django API. There is no Supabase client — the browser
never holds a database key.

## Layout

```
src/
  App.jsx                  routes (everything but the landing page is lazy)
  main.jsx
  styles/index.css         Tailwind entry, base styles, shared component classes
  lib/
    api/client.js          fetch wrapper: auth, refresh, dedupe, cache, abort
    api/endpoints.js       every API call, with its cache policy
    auth.js                session store (useSession)
    cache.js               memory + sessionStorage TTL cache
    hooks.js               useApi, useMutation, useDebouncedValue, useMediaQuery
    format.js              shared Intl formatters
    cn.js
  components/
    ui/                    Button, Card, Field, Feedback, Pagination
    layout/                Navbar, Footer, SiteLayout (Page, PageHeader)
    ErrorBoundary.jsx
  features/
    scholarships/          card, filters, useScholarshipQuery
    marketing/             carousel, programs, FAQ
  routes/ProtectedRoute.jsx
  pages/                   one file per screen, admin screens under pages/admin
```

## Data layer

`lib/api/client.js` is the only place that calls `fetch`. It handles:

- attaching the JWT and refreshing it once on a `401`, collapsing concurrent
  refreshes into a single request
- de-duplicating identical in-flight GETs
- serving cached responses with stale-while-revalidate
- `AbortSignal` support, so an unmounted screen stops waiting — note the shared
  request itself keeps running and fills the cache, because cancelling it would
  break every other caller waiting on the same URL
- turning DRF error bodies into an `ApiError` with per-field messages

Cache policy lives in `lib/api/endpoints.js`, next to the call it applies to.
Mutations declare the tags they invalidate:

```js
create: (payload) =>
  api.post("/admin/scholarships/", payload, {
    invalidates: [TAGS.scholarships, TAGS.statistics],
  }),
```

Screens use `useApi`, which aborts on unmount and ignores superseded responses,
so a fast typist can never have an old search overwrite a newer one.

## Filtering

`useScholarshipQuery` keeps filter state in the URL (`?q=&country=&ongoing=`),
debounces the search box, and sends the filters to the server. The browser
downloads one page (24 cards, without the long description/benefits/eligibility
text) rather than the whole table.

Any filtered view is therefore shareable and survives a refresh.

## Design tokens

`tailwind.config.js` defines `brand` (navy → sky) and `gold`, which hold the
same values the site already used — `brand-900` is `sky-900`, `gold-600` is
`yellow-600`. Use the tokens rather than raw Tailwind colours so the palette
stays consistent.

- `bg-brand-wash` — the navy-to-gold gradient on the header and footer
- `bg-brand-diagonal` — the programs section
- `.surface` — standard card: rounded, bordered, subtle shadow
- Focus rings are applied globally in `styles/index.css`; don't add per-element
  `focus:ring-*` classes.

## Routes

| Path | Access |
| --- | --- |
| `/`, `/scholarships`, `/scholarships/:id`, `/programs`, `/contact` | public |
| `/whatsapp` | public page, invite link requires sign-in |
| `/login`, `/signup` | signed-out only |
| `/admin/scholarships`, `/admin/scholarships/new`, `/admin/scholarships/:id/edit` | admin |
| `/admin/users` | super admin |

Guards live in `routes/ProtectedRoute.jsx` and run before the protected screen
renders. Old URLs (`/scholarship-list`, `/post-scholarship`, `/super-admin-panel`,
…) redirect to their new equivalents.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | dev server on :5173 |
| `npm run build` | production build |
| `npm run preview` | serve the build on :4173 |
| `npm run lint` | ESLint |

## Deployment (Cloudflare Pages)

- Build command `npm run build`, output directory `dist`.
- Set `VITE_BACKEND_URL=https://myscholyscholarship-backend.onrender.com/api`
  as a build environment variable — Vite bakes it in at build time.
- `public/_redirects` (`/* /index.html 200`) makes deep links and hard
  refreshes work with client-side routing.
- If the site runs on a custom domain, add that origin to
  `DJANGO_CORS_ALLOWED_ORIGINS` on the Render backend; `*.pages.dev` preview
  URLs are already allowed.
