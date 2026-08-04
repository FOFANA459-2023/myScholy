import React from "react";
import { Link } from "react-router-dom";

import { Page, PageHeader } from "../components/layout/SiteLayout.jsx";
import { Button, ComingSoon } from "../components/ui/index.js";
import RoadmapSection from "../features/marketing/RoadmapSection.jsx";

/** What a student actually receives, as service cards rather than a list. */
const SERVICES = [
  {
    title: "Eligibility & fit assessment",
    body: "We look at your profile against the programs you are targeting and tell you honestly what you qualify for, before you spend weeks on an application that was never going to land.",
  },
  {
    title: "Planning session",
    body: "One working session to lay out every deadline, requirement and document you need, in the order you need them. You leave knowing exactly what happens next.",
  },
  {
    title: "Portals & documents",
    body: "We set up your accounts on each school or scholarship platform and check every upload against that portal's own checklist, so nothing is rejected on a technicality.",
  },
  {
    title: "Essay editing & proofreading",
    body: "Our specialty. Line-by-line editing for grammar, clarity and tone, plus structural feedback on whether your argument holds and answers the question asked.",
    specialty: true,
  },
  {
    title: "Resume & CV editing",
    body: "On request, alongside the essay work. You supply the content; we sharpen the wording, structure and formatting to what admissions committees expect to see.",
  },
  {
    title: "Interview preparation",
    body: "Practice for the conversations that decide the shortlist, with feedback on how you answer rather than a script to memorise.",
  },
];

/**
 * The boundaries of the service, framed as what we do instead. Stating only
 * the limits reads defensive; pairing each with the real service makes the
 * exchange clear.
 */
const BOUNDARIES = [
  {
    not: "We do not award scholarships or grant admission",
    instead:
      "We find and verify real opportunities, list them free, and guide your application to the institution that does decide.",
  },
  {
    not: "We do not write essays for students",
    instead:
      "You write the draft. We edit and proofread it until it is as strong as it can be - which is what the rules require, and what actually wins.",
  },
  {
    not: "We do not guarantee an outcome",
    instead:
      "We make sure your application is complete, on time, well presented and free of the mistakes that cut strong candidates early.",
  },
];

export default function ConsultingPage() {
  return (
    <>
      <Page width="default">
        <PageHeader
          title="Application & scholarship consulting"
          description="Hands-on guidance through your application - from working out what you qualify for to hitting submit."
        />

        {/* Stated before the service is described, so nobody reads the rest
            believing they can book today. */}
        <ComingSoon className="mb-8">
          <p>
            Our consulting service is coming soon. While the service is not available
            yet, we have outlined everything it will include so you can see exactly
            what to expect when it launches.
          </p>
        </ComingSoon>

        {/* The note, stated before anything is sold. */}
        <aside
          className="surface border-l-4 border-brand-600 p-6 sm:p-7"
          aria-label="Important note about our service"
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">
            Note
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-700 sm:text-base">
            myScholy does not award scholarships or grant admission - those decisions
            belong entirely to the institutions offering them. We verify and list
            opportunities free of charge, and our paid consulting will guide you
            through applying. We also do not write essays for students: you write the
            draft, we edit and proofread it until it is as strong as it can be. Please
            refer to our{" "}
            <Link
              to="/#faq"
              className="rounded font-semibold text-brand-800 underline underline-offset-4 hover:text-brand-600"
            >
              frequently asked questions
            </Link>{" "}
            for more information.
          </p>
        </aside>

        {/* Services as cards. */}
        <section className="mt-12" aria-labelledby="services">
          <h2 id="services" className="text-2xl font-bold text-brand-900 sm:text-3xl">
            What the service covers
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">
            When consulting opens, this is the work we do alongside you.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <article
                key={service.title}
                className={`surface flex flex-col p-6 transition-shadow duration-300 hover:shadow-card-hover ${
                  service.specialty ? "border-gold-300 bg-gold-50/50" : ""
                }`}
              >
                <h3 className="text-base font-bold text-brand-900">{service.title}</h3>
                {service.specialty && (
                  <span className="mt-2 self-start rounded-full bg-gold-200/80 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gold-900">
                    Our specialty
                  </span>
                )}
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {service.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Boundaries, as paired statements. */}
        <section className="mt-14" aria-labelledby="boundaries">
          <h2 id="boundaries" className="text-2xl font-bold text-brand-900 sm:text-3xl">
            Where we draw the line
          </h2>
          <p className="mt-2 max-w-2xl text-ink-600">
            Being clear about what we will not do matters as much as what we will.
          </p>

          <dl className="mt-6 divide-y divide-ink-200/70 overflow-hidden rounded-2xl border border-ink-200/70 bg-white">
            {BOUNDARIES.map((item) => (
              <div key={item.not} className="grid gap-4 p-6 md:grid-cols-2 md:gap-8">
                <dt className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-red-100 text-sm font-bold text-red-700"
                  >
                    &times;
                  </span>
                  <span className="font-semibold text-ink-900">{item.not}</span>
                </dt>
                <dd className="flex items-start gap-3 md:border-l md:border-ink-200/70 md:pl-8">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
                  >
                    &#10003;
                  </span>
                  <span className="text-sm leading-relaxed text-ink-600">
                    {item.instead}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Who it is for. The "in the meantime" links live in the banner at the
            top of the page, so they are not repeated down here. */}
        <section className="mt-12">
          <div className="surface p-6 sm:p-7">
            <h2 className="text-base font-bold text-brand-900">Who this is for</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-600">
              Students aged 18 and above applying for undergraduate, graduate or
              postgraduate opportunities. Not sure whether that is you? The short
              assessment answers it in about a minute, and it works today even though
              bookings have not opened. The scholarship board stays free either way -
              no account, no fees, no catch.
            </p>
            <div className="mt-5">
              <Button to="/assessment">Check if we are a fit</Button>
            </div>
          </div>
        </section>
      </Page>

      <RoadmapSection />
    </>
  );
}
