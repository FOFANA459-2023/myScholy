import React from "react";
import { Link } from "react-router";

import cn from "../../lib/cn.js";
import AuthorAvatar from "./AuthorAvatar.jsx";
import { TOPICS } from "./topics.js";

/**
 * The Insights masthead.
 *
 * Built like a journal nameplate rather than the usual gradient-band-with-a-
 * centred-headline: an asymmetric split, a letterspaced rule carrying live
 * issue statistics, a hand-drawn underline on the phrase that matters, and -
 * on the right - the actual contributors, because the people are the product
 * here. A generic hero would say "read our blog"; this one says who is
 * writing and how much there is.
 *
 * The texture is two cheap layers (a dot lattice and one blurred gold bloom)
 * rather than an image, so it costs nothing on the largest contentful paint.
 */

/** Small-caps statistic in the nameplate rule. */
function Metric({ value, label }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold text-gold-300">{value}</span>{" "}
      <span className="text-white/55">{label}</span>
    </span>
  );
}

export default function InsightsMasthead({ highlights, search, onSearch }) {
  const contributors = highlights?.contributors ?? [];
  const total = highlights?.total_articles ?? 0;

  return (
    <header className="relative isolate overflow-hidden bg-brand-950">
      {/* Dot lattice. Pure CSS, so there is no image to download. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[0.22]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* Gold bloom bleeding in from the top right, echoing the brand wash
          without repeating the literal navy-to-gold gradient used elsewhere. */}
      <div
        aria-hidden="true"
        className="absolute -right-32 -top-40 -z-10 h-[34rem] w-[34rem] rounded-full bg-gold-500/25 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-52 left-1/4 -z-10 h-[26rem] w-[26rem] rounded-full bg-brand-500/25 blur-[120px]"
      />

      <div className="container py-12 sm:py-16">
        {/* Nameplate rule */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/15 pb-4">
          <span className="text-xs font-bold uppercase tracking-[0.35em] text-white">
            Insights
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-gold-400/70 to-transparent" />
          <div className="flex items-center gap-4 text-xs">
            <Metric value={total} label={total === 1 ? "piece" : "pieces"} />
            <span className="text-white/20" aria-hidden="true">
              /
            </span>
            <Metric
              value={highlights?.total_contributors ?? 0}
              label="writers"
            />
            <span className="hidden text-white/20 sm:inline" aria-hidden="true">
              /
            </span>
            <span className="hidden sm:inline">
              <Metric value={highlights?.topics_covered ?? 0} label="topics" />
            </span>
          </div>
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
          {/* Left: the statement */}
          <div>
            {/* No hard line break: the column is fluid, and a <br> that reads
                well at one width strands a single word at another. */}
            <h1 className="max-w-[16ch] text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl xl:text-6xl">
              Nobody wins a scholarship by guessing.{" "}
              {/* The underline is drawn, not a border: a straight rule reads as
                  a link, a drawn stroke reads as someone marking up a page. */}
              <span className="relative inline-block">
                <span className="relative z-10">Learn from</span>
                {/* preserveAspectRatio="none" stretches the viewBox to the
                    span's width, which flattens any gentle curve - so the
                    stroke is drawn with a deliberately exaggerated rise and
                    fall, and a second shorter pass beneath it, to survive the
                    squash and still read as a pen mark rather than a rule. */}
                <svg
                  viewBox="0 0 300 24"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  className="absolute -bottom-2 left-0 h-4 w-full text-gold-400"
                >
                  <path
                    d="M4 15C52 5 104 19 152 11c46-8 96 6 144 2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M26 22c60-7 128 5 210-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                </svg>
              </span>{" "}
              <span className="text-gold-300">people who did.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/70">
              Essays, interviews, applications and life abroad - written by the
              mentors and scholars who have already sat on the other side of
              every one of them.
            </p>

            {/* A ruled input rather than a rounded pill: it belongs to the
                masthead instead of floating on top of it. */}
            <div className="mt-9 max-w-md">
              <label htmlFor="insights-search" className="sr-only">
                Search insights
              </label>
              <div className="group flex items-center gap-3 border-b-2 border-white/25 pb-2 transition-colors focus-within:border-gold-400">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-white/45 transition-colors group-focus-within:text-gold-400"
                >
                  <path
                    strokeLinecap="round"
                    d="m21 21-4.3-4.3M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z"
                  />
                </svg>
                <input
                  id="insights-search"
                  type="search"
                  value={search}
                  onChange={(event) => onSearch(event.target.value)}
                  placeholder="Search by topic, title or writer"
                  className="w-full bg-transparent text-base text-white caret-gold-400 placeholder:text-white/40 focus:outline-none focus:ring-0"
                />
              </div>
            </div>
          </div>

          {/* Right: who is actually writing */}
          <div className="lg:pt-2">
            {contributors.length > 0 && (
              <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 backdrop-blur">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold-300">
                  This issue&apos;s writers
                </p>

                {/* Overlapping cluster, then the names in full underneath -
                    the faces draw the eye, the list does the telling. */}
                <div className="mt-4 flex -space-x-3">
                  {contributors.slice(0, 6).map((person) => (
                    <AuthorAvatar
                      key={person.name}
                      name={person.name}
                      topic={person.topic}
                      photo={person.photo}
                      className="ring-brand-950"
                    />
                  ))}
                  {contributors.length > 6 && (
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white ring-2 ring-brand-950">
                      +{contributors.length - 6}
                    </span>
                  )}
                </div>

                <ul className="mt-5 space-y-2.5">
                  {contributors.slice(0, 3).map((person) => (
                    <li key={person.name} className="text-sm leading-snug">
                      <span className="font-medium text-white">{person.name}</span>
                      {person.role && (
                        <span className="block text-xs text-white/55">
                          {person.role}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/contact"
                  className="mt-5 inline-flex items-center gap-1.5 rounded text-sm font-medium text-gold-300 transition-colors hover:text-gold-200"
                >
                  Write for myScholy
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The topic spectrum: every topic colour laid end to end, which turns
          the palette used throughout the feed into the masthead's bottom rule. */}
      <div aria-hidden="true" className="flex h-1.5">
        {TOPICS.map((topic) => (
          <span
            key={topic.value}
            className={cn("flex-1 bg-gradient-to-r", topic.onDark)}
          />
        ))}
      </div>
    </header>
  );
}
