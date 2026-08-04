import React from "react";

import { Page, PageHeader } from "../components/layout/SiteLayout.jsx";
import { Button, ComingSoon } from "../components/ui/index.js";

const TRACKS = [
  {
    title: "Coding bootcamp",
    body: "A practical route into software - built for students starting from the beginning, not for people who already write code.",
  },
  {
    title: "Entrepreneurship bootcamp",
    body: "Turning an idea into something that runs: validating it, planning it and taking the first real steps.",
  },
  {
    title: "Monthly webinars",
    body: "One to two live sessions every month on using the platform, finding opportunities and putting applications together.",
  },
  {
    title: "Mentors, students and alumni",
    body: "Tips and sessions from people currently studying at, or graduated from, the universities listed on our board.",
  },
];

export default function AcademyPage() {
  return (
    <Page width="default">
      <PageHeader
        title="myScholy Academy"
        description="Our online school - coding and entrepreneurship bootcamps, plus regular live sessions."
      />

      <ComingSoon className="mb-8">
        <p>
          The Academy is not open for enrolment yet. Nothing here is bookable today,
          and we are not taking payments for it.
        </p>
        <p>
          What is planned is set out below, so you can see now whether it is worth
          waiting for.
        </p>
      </ComingSoon>

      <h2 className="text-2xl font-bold text-brand-900 sm:text-3xl">
        What the Academy will offer
      </h2>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        {TRACKS.map((track) => (
          <article key={track.title} className="surface p-6">
            <h3 className="text-base font-bold text-brand-900">{track.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">{track.body}</p>
          </article>
        ))}
      </div>

      {/* Enrolment, the board and the community are all linked from the banner
          at the top, so this closes on the one thing it does not cover. */}
      <div className="surface mt-8 p-6 text-center sm:p-8">
        <h2 className="text-lg font-bold text-brand-900">
          Want to know when enrolment opens?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-ink-600">
          The WhatsApp community hears first. Our consulting service is being built
          alongside the Academy - you can read what it will cover too.
        </p>
        <div className="mt-6">
          <Button to="/consulting" variant="outline">
            Read about consulting
          </Button>
        </div>
      </div>
    </Page>
  );
}
