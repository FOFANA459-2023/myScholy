import React from "react";

import { Badge } from "./Card.jsx";

/**
 * How well a scholarship fits the signed-in student, 0-100.
 *
 * The number is the server's rule-based score (see backend matching.py), not
 * an AI guess - it is the share of the signals both the profile and the
 * listing actually state that came out matching. That is why a listing which
 * says very little can still score high: absent is treated as "unknown", not
 * as a mismatch.
 *
 * Renders nothing when `score` is null, which is how the API reports "this
 * student has no profile yet, so there is no honest score to show".
 */

const BANDS = [
  { min: 80, tone: "success", label: "Strong match" },
  { min: 55, tone: "brand", label: "Good match" },
  { min: 0, tone: "neutral", label: "Possible match" },
];

function bandFor(score) {
  return BANDS.find((band) => score >= band.min) ?? BANDS[BANDS.length - 1];
}

export default function MatchScore({ score, blocked = false, className }) {
  if (score === null || score === undefined) return null;

  if (blocked) {
    // A student who may not qualify is told so plainly rather than being
    // shown an encouraging percentage next to a rule that rules them out.
    return (
      <Badge tone="gold" className={className}>
        Check eligibility
      </Badge>
    );
  }

  const band = bandFor(score);
  return (
    <Badge tone={band.tone} className={className}>
      <span aria-hidden="true">{score}%</span>
      <span className="sr-only">{`${score} percent match`}</span>
      <span className="hidden sm:inline"> · {band.label}</span>
    </Badge>
  );
}
