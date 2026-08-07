import React, { useEffect, useRef, useState } from "react";

import { Button } from "../../components/ui/index.js";

/**
 * The consulting journey, start to submission.
 *
 * Rendered as a spine that runs from navy to gold - the site's signature
 * gradient - so the colour itself tracks progress through the process. Steps
 * alternate sides on desktop and collapse onto a single rail on mobile.
 */
const STEPS = [
  {
    title: "Eligibility / fit assessment",
    detail: "We look at your profile and target programs to see what you realistically qualify for.",
  },
  {
    title: "Onboarding workshop",
    detail: "A working session to map out your deadlines, requirements and plan of attack.",
  },
  {
    title: "Document submission",
    detail: "You send us transcripts, certificates and supporting paperwork.",
  },
  {
    title: "Create application portal",
    detail: "Accounts are set up on each school or scholarship platform you are applying to.",
  },
  {
    title: "Essay writing",
    detail: "First drafted by you - your story, in your own voice, is where every strong essay starts.",
  },
  {
    title: "Essay editing and proofreading",
    detail: "Line-by-line editing and structural feedback until the essay is submission-ready.",
    specialty: true,
  },
  {
    title: "Resume / CV proofreading and editing",
    detail: "Provided on request, formatted to what admissions committees expect to see.",
    specialty: true,
  },
  {
    title: "Document submission",
    detail: "Every required document is uploaded and checked against the portal's checklist.",
  },
  {
    title: "Application submission",
    detail: "A final review together, then your application goes in before the deadline.",
  },
];

/** Reveal each step as it scrolls into view. */
function useRevealOnScroll(count) {
  const [revealed, setRevealed] = useState(() => new Set());
  const refs = useRef([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      // No observer (or a very old browser): show everything rather than
      // leaving the section permanently blank.
      setRevealed(new Set(Array.from({ length: count }, (_, i) => i)));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number(entry.target.dataset.step));
        if (seen.length) {
          setRevealed((current) => new Set([...current, ...seen]));
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );

    refs.current.filter(Boolean).forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [count]);

  const register = (index) => (node) => {
    refs.current[index] = node;
  };

  return { revealed, register };
}

export default function RoadmapSection() {
  const { revealed, register } = useRevealOnScroll(STEPS.length);

  return (
    <section id="roadmap" className="bg-white py-16 sm:py-20">
      <div className="container">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">
            How we work
          </p>
          <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
            Admissions and scholarship applications consulting
          </h2>
          <p className="mt-4 text-ink-600">
            We are specialists in admissions and scholarship application essays - editing
            and proofreading until your writing does your story justice. This is the
            journey the service will take you through; bookings are not open yet.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm text-brand-900">
            <span aria-hidden="true">🎓</span>
            For students 18 and above pursuing undergraduate, graduate and postgraduate
            opportunities
          </p>
        </div>

        <ol className="relative mx-auto max-w-4xl">
          {/* The spine runs down the centre at every width; only the spacing
              around it tightens on small screens. */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 top-0 w-0.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-brand-700 via-brand-400 to-gold-400"
          />

          {STEPS.map((step, index) => {
            const isRight = index % 2 === 1;
            const isVisible = revealed.has(index);

            return (
              <li
                key={`${step.title}-${index}`}
                ref={register(index)}
                data-step={index}
                className="relative pb-8 last:pb-0 sm:pb-10"
              >
                <div
                  className={`flex items-center ${isRight ? "flex-row" : "flex-row-reverse"}`}
                >
                  {/* Spacer keeps each card on its own side of the spine. */}
                  <div className="w-1/2" aria-hidden="true" />

                  <div
                    className={`w-1/2 ${
                      isRight ? "pl-4 sm:pl-10" : "pr-4 text-right sm:pr-10"
                    }`}
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? "none" : "translateY(14px)",
                      transition: "opacity 500ms ease-out, transform 500ms ease-out",
                    }}
                  >
                    <article
                      className={`surface p-4 transition-shadow duration-300 hover:shadow-card-hover sm:p-5 ${
                        step.specialty ? "border-gold-300 bg-gold-50/60" : ""
                      }`}
                    >
                      <div
                        className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${
                          isRight ? "" : "justify-end"
                        }`}
                      >
                        <h3 className="text-sm font-bold text-brand-900 sm:text-base">
                          {step.title}
                        </h3>
                        {step.specialty && (
                          <span className="rounded-full bg-gold-200/80 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-gold-900 sm:px-2.5 sm:text-xs">
                            Our specialty
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-600 sm:mt-2 sm:text-sm">
                        {step.detail}
                      </p>
                    </article>
                  </div>
                </div>

                {/* Numbered node, pinned to the spine. */}
                <span
                  className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-4 border-white text-xs font-bold text-white shadow-card sm:h-9 sm:w-9 sm:text-sm"
                  style={{
                    backgroundColor: step.specialty ? "#ca8a04" : "#0c4a6e",
                    // Composed with the centring translate above, so the node
                    // stays on the spine while it pops in.
                    transform: isVisible
                      ? undefined
                      : "translate(-50%, -50%) scale(0.7)",
                    transition: "transform 400ms ease-out",
                  }}
                >
                  {index + 1}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-14 text-center">
          <p className="mx-auto max-w-xl text-ink-600">
            Not sure where you fit? Answer five quick questions and find out what we can
            do for you - it takes about a minute.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button to="/assessment" size="lg" variant="primary">
              Start with an assessment
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
