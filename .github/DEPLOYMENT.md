# Frontend CI/CD setup (Cloudflare Pages)

Workflows in this repo:

| Workflow | Trigger | What it does |
| --- | --- | --- |
| `ci.yml` | every PR + push to main | lint, unit/component tests, build, npm audit, full-stack e2e; deploys to Cloudflare Pages **only from main** after all gates pass |
| `pr-review.yml` | every PR | dependency review (active now) + Claude automated review (activates when `ANTHROPIC_API_KEY` is added; skips quietly until then) |
| `codeql.yml` | PRs, main, weekly | JavaScript static security analysis |

## One-time repository configuration

Add these at
<https://github.com/FOFANA459-2023/myScholy/settings/secrets/actions>.
**GitHub Actions cannot read a `.env` file** - your local `frontend/.env` is
only a personal record; the values must be entered here.

**Secrets** (Secrets tab → "New repository secret")

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | the token in your local `frontend/.env` |
| `CLOUDFLARE_ACCOUNT_ID` | the account id in your local `frontend/.env` |
| `ANTHROPIC_API_KEY` | *(later - the Claude PR review stays skipped until this exists)* |

**Variables** (Variables tab → "New repository variable") - all optional,
the workflow defaults already match your setup:

| Variable | Default baked into the workflow |
| --- | --- |
| `CLOUDFLARE_PAGES_PROJECT` | `myscholy` |
| `BACKEND_REPO` | `FOFANA459-2023/myScholyScholarship_Backend` (the e2e suite checks this out; both repos are public, so no token is needed) |
| `VITE_BACKEND_URL` | `https://myscholyscholarship-backend.onrender.com/api` |

Also disable Cloudflare Pages' own Git integration build for this project if
it is connected (Pages project → Settings → Builds): CI deploys the tested
bundle via wrangler, and a second parallel build would race it.

## Branch protection (one-time)

Settings → Rules → Rulesets → New branch ruleset targeting `main`:
require a pull request (1 approval, dismiss stale approvals), require these
status checks (strict): **Frontend / lint**, **Frontend / unit + component
tests**, **Frontend / build**, **Security / dependency audit**,
**End-to-end (Playwright, full stack)**; require conversation resolution;
block force pushes and deletions.

## Local equivalents

```bash
npm run lint && npm test && npm run build && npm run e2e
```

The e2e suite expects the backend checked out as a sibling `../backend`
directory (the monorepo layout) and starts its own throwaway stack: Django on
:8001 with a seeded sqlite DB, Vite preview on :4173.
