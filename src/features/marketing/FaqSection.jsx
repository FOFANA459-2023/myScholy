import React, { useState } from "react";
import { Link } from "react-router";

import { Note } from "../../components/ui/index.js";
import { FAQ_GROUPS, FEATURED_FAQS } from "./faqData.js";

/**
 * Accordion built on native <details>, so it works without JavaScript and is
 * keyboard accessible for free.
 *
 * Two shapes: `grouped` renders every topic with its own heading (the FAQ
 * page), while the default renders a short featured set with a link through to
 * the full page (marketing pages).
 */
function FaqList({ faqs, idPrefix }) {
  const [openKey, setOpenKey] = useState(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const key = `${idPrefix}-${index}`;
        return (
          <details
            key={faq.question}
            open={openKey === key}
            onToggle={(event) => {
              if (event.currentTarget.open) setOpenKey(key);
              else if (openKey === key) setOpenKey(null);
            }}
            className="group surface overflow-hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-ink-800 transition-colors hover:text-brand-800 sm:px-6">
              <span>{faq.question}</span>
              <span
                aria-hidden="true"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-lg font-bold text-brand-700 transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            {/* An answer is a string, or an array of paragraphs when one
                needs more than a single block to say it properly. */}
            <div className="space-y-3 px-5 pb-5 text-sm leading-relaxed text-ink-600 sm:px-6">
              {(Array.isArray(faq.answer) ? faq.answer : [faq.answer]).map(
                (paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ),
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default function FaqSection({ grouped = false }) {
  if (grouped) {
    return (
      <section
        id="faq"
        className="scroll-mt-20 bg-gradient-to-br from-brand-100 via-brand-50 to-gold-50 py-16 sm:py-20"
      >
        <div className="container max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-ink-900 sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-ink-600">
              What we do, what we deliberately do not do, and what any of it costs.
            </p>
          </div>

          {/* The disclaimer everything below rests on, in the same gold Note
              the consulting page opens with. */}
          <Note className="mb-10">
            <p>
              myScholy does not award scholarships or grant admission - those
              decisions belong entirely to the institutions offering them. We verify
              and list opportunities free of charge. Our paid consulting, which will
              guide you through applying, is coming soon. We also do not write essays
              for students: you write the draft, we edit and proofread it until it is
              as strong as it can be.
            </p>
          </Note>

          {FAQ_GROUPS.map((group) => (
            <div key={group.id} id={group.id} className="mb-12 last:mb-0 scroll-mt-24">
              <h3 className="text-2xl font-bold text-ink-900 sm:text-3xl">
                {group.title}
              </h3>
              <p className="mb-6 mt-1.5 text-sm text-ink-500">{group.blurb}</p>
              <FaqList faqs={group.faqs} idPrefix={group.id} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="faq"
      className="scroll-mt-20 bg-gradient-to-br from-brand-100 via-brand-50 to-gold-50 py-16 sm:py-20"
    >
      <div className="container max-w-3xl">
        <h2 className="mb-10 text-center text-3xl font-bold text-ink-900 sm:text-4xl">
          Frequently asked questions
        </h2>

        <FaqList faqs={FEATURED_FAQS} idPrefix="featured" />

        <p className="mt-8 text-center text-sm text-ink-600">
          More on applications, essays and fees in the{" "}
          <Link
            to="/#faq"
            className="rounded font-semibold text-brand-800 underline-offset-4 hover:underline"
          >
            full FAQ
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
