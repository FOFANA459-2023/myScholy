import React from "react";

import { Button } from "../../components/ui/index.js";

/**
 * The two pillars of the platform.
 *
 * Both are still being built, so each is presented honestly as upcoming rather
 * than bookable - with the full description kept, because someone deciding
 * whether to wait needs to know what they would be waiting for. The free
 * scholarship board is the thing that is actually live today.
 */
const PILLARS = [
  {
    name: "Application & scholarship consulting",
    status: "Coming soon",
    available: false,
    summary:
      "Hands-on support through the whole application, from working out what you qualify for to hitting submit before the deadline.",
    includes: [
      "Eligibility and fit assessment",
      "Essay editing and proofreading - our specialty",
      "Resume / CV proofreading, on request",
      "Interview preparation",
      "Application portal setup and submission",
    ],
    note: "Not open for bookings yet, and no payments are being taken. Everything on the scholarship board stays free regardless.",
    actions: [
      { label: "What it covers", to: "/consulting" },
      { label: "Check if we are a fit", to: "/assessment", variant: "outline" },
    ],
  },
  {
    name: "myScholy Academy",
    status: "Coming soon",
    available: false,
    summary:
      "Our online school, opening with coding and entrepreneurship bootcamps once the scholarship service is fully running.",
    includes: [
      "Coding bootcamps",
      "Entrepreneurship bootcamps",
      "Monthly webinars and information sessions",
      "Tips from mentors, current students and alumni",
    ],
    note: "Want to hear when enrolment opens? The WhatsApp community gets the announcement first.",
    actions: [
      { label: "What is planned", to: "/academy" },
      { label: "Get notified", to: "/whatsapp", variant: "outline" },
    ],
  },
];

export default function ProgramsSection() {
  return (
    <section id="programs" className="bg-brand-diagonal py-16 sm:py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Programs and services
          </h2>
          <p className="mt-3 text-white/85">
            myScholy is more than a scholarship board. The board is free, always - these
            are the services built around it.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {PILLARS.map((pillar) => (
            <article
              key={pillar.name}
              className="flex flex-col rounded-2xl bg-white/95 p-7 shadow-card backdrop-blur transition-shadow duration-300 hover:shadow-card-hover"
            >
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-bold text-brand-900">{pillar.name}</h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
                    pillar.available
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gold-100 text-gold-900"
                  }`}
                >
                  {pillar.status}
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink-600">
                {pillar.summary}
              </p>

              <ul className="mt-5 flex-1 space-y-2">
                {pillar.includes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <span
                      aria-hidden="true"
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                        pillar.available ? "bg-brand-600" : "bg-gold-500"
                      }`}
                    />
                    <span className="text-ink-700">{item}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 border-t border-ink-200/70 pt-4 text-sm text-ink-500">
                {pillar.note}
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                {pillar.actions.map((action) => (
                  <Button
                    key={action.label}
                    to={action.to}
                    variant={action.variant || "primary"}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </article>
          ))}
        </div>

        {/* Exam prep is delivered with a partner, so it sits outside the two
            pillars rather than being presented as our own program. */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/25 bg-white/10 p-6 backdrop-blur sm:flex-row">
          <div>
            <h3 className="text-base font-bold text-white">
              Exam preparation with our partner
            </h3>
            <p className="mt-1 text-sm text-white/85">
              Coaching for the SAT, ACT, GRE, TOEFL and IELTS through Tutorants.
            </p>
          </div>
          <Button href="https://tutorants.com/" variant="gold">
            Start prep
          </Button>
        </div>
      </div>
    </section>
  );
}
