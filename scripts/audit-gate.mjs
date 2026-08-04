/**
 * Security gate: fail on any high/critical npm advisory, except an explicit,
 * documented allowlist. `npm audit --audit-level=high` alone cannot exclude
 * advisories that demonstrably do not apply to this app, and permanently red
 * CI teaches people to ignore it.
 *
 * Every entry here must say WHY it is safe to ignore and WHEN to remove it.
 */
import { execSync } from "node:child_process";

const ALLOWLIST = {
  // React Router "RSC Mode CSRF Bypass" (>=7.12 <8.3). Exploitable only when
  // the app uses React Router's RSC (React Server Components) mode; this is a
  // client-rendered SPA using <BrowserRouter> - RSC mode is never enabled.
  // The fixed line (v8.3+) requires React 19. Remove this entry when the app
  // upgrades to React 19 + react-router 8.
  "GHSA-qwww-vcr4-c8h2": "RSC-mode-only CSRF; app does not use RSC mode",
};

let report;
try {
  report = JSON.parse(execSync("npm audit --json", { encoding: "utf8" }));
} catch (error) {
  // npm audit exits non-zero when vulnerabilities exist; the JSON is still
  // on stdout. Anything else (no lockfile, registry down) is a real failure.
  if (!error.stdout) throw error;
  report = JSON.parse(error.stdout);
}

const blocking = [];
const waived = [];

for (const [pkg, vuln] of Object.entries(report.vulnerabilities ?? {})) {
  if (!["high", "critical"].includes(vuln.severity)) continue;

  // Advisories reach a package either directly (objects in `via`) or through
  // a dependency (strings naming the parent, reported on the parent itself).
  const advisories = vuln.via.filter((v) => typeof v === "object");
  if (advisories.length === 0) continue; // transitive echo of a parent entry

  for (const adv of advisories) {
    const id = adv.url?.split("/").pop() ?? String(adv.source);
    const line = `${pkg}: ${adv.title} (${id}, ${adv.severity})`;
    if (ALLOWLIST[id]) waived.push(`${line} - waived: ${ALLOWLIST[id]}`);
    else if (["high", "critical"].includes(adv.severity)) blocking.push(line);
  }
}

for (const line of waived) console.log(`ALLOWLISTED  ${line}`);

if (blocking.length > 0) {
  console.error("\nBlocking vulnerabilities (high/critical):");
  for (const line of blocking) console.error(`  ${line}`);
  process.exit(1);
}

console.log(`\naudit gate passed (${waived.length} allowlisted, 0 blocking)`);
