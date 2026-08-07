import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { Alert, Button, LoadingDots } from "../../components/ui/index.js";
import { assistant as assistantApi } from "../../lib/api/endpoints.js";

/**
 * Self-serve fit assessment.
 *
 * Six quick questions. When the backend has an AI key configured, the result
 * is personalized: a Gemini-written plan grounded with live scholarships from
 * the board that match the visitor's level and region. Without a key (or if
 * the call fails) the original rule-based verdict renders instead, so the
 * quiz always produces something.
 *
 * Only the quiz option values are sent - no name, email or anything personal.
 */

const QUESTIONS = [
  {
    id: "age",
    question: "How old are you?",
    help: "Our consulting service is for adult applicants.",
    options: [
      // `terminal` answers decide the outcome on their own - there is no point
      // asking about essays and deadlines once we know we cannot help yet.
      { value: "under18", label: "Under 18", terminal: true },
      { value: "18plus", label: "18 or older" },
    ],
  },
  {
    id: "level",
    question: "What are you applying for?",
    help: "Pick the level you are seeking admission or funding for.",
    options: [
      { value: "undergraduate", label: "Undergraduate" },
      { value: "graduate", label: "Graduate (Masters)" },
      { value: "postgraduate", label: "Postgraduate (PhD, fellowship)" },
      { value: "other", label: "Something else", terminal: true },
    ],
  },
  {
    id: "region",
    question: "Where would you like to study?",
    help: "We'll match you with scholarships in that part of the world.",
    options: [
      { value: "Anywhere", label: "Anywhere - show me everything" },
      { value: "Africa", label: "Africa" },
      { value: "Asia", label: "Asia" },
      { value: "Europe", label: "Europe" },
      { value: "North America", label: "North America" },
      { value: "Middle East", label: "Middle East" },
    ],
  },
  {
    id: "stage",
    question: "Where are you in the process?",
    help: "There is no wrong answer - it just changes where we start.",
    options: [
      { value: "exploring", label: "Still exploring my options" },
      { value: "shortlist", label: "I have a shortlist of schools or scholarships" },
      { value: "applying", label: "Actively applying, deadlines are close" },
    ],
  },
  {
    id: "essay",
    question: "How far along is your application essay?",
    help: "We edit and proofread - the first draft always comes from you.",
    options: [
      { value: "none", label: "Not started yet" },
      { value: "draft", label: "I have a rough draft" },
      { value: "ready", label: "It is written and needs polishing" },
    ],
  },
  {
    id: "cv",
    question: "Do you also want your resume / CV reviewed?",
    help: "Offered on request alongside the essay work.",
    options: [
      { value: "yes", label: "Yes, please" },
      { value: "no", label: "No, just the essay" },
    ],
  },
];

const LEVEL_LABELS = {
  undergraduate: "undergraduate",
  graduate: "graduate",
  postgraduate: "postgraduate",
};

/** Rule-based fallback verdict, used when the AI result is unavailable. */
function assess(answers) {
  if (answers.age === "under18") {
    return {
      eligible: false,
      title: "Not quite yet",
      message:
        "Our admissions consulting is for applicants aged 18 and above. That is the only thing standing between us - come back when you turn 18 and we will pick this up properly.",
      actions: [],
    };
  }

  if (answers.level === "other") {
    return {
      eligible: false,
      title: "Let's talk first",
      message:
        "We specialise in undergraduate, graduate and postgraduate applications. Tell us what you are working towards and we will let you know honestly whether we are the right fit.",
      actions: [{ label: "Send us a message", to: "/contact" }],
    };
  }

  // Eligible. Build the plan from the answers rather than listing everything.
  const services = [];

  services.push(
    answers.stage === "exploring"
      ? "Eligibility and fit assessment to narrow down programs worth your time"
      : "Eligibility and fit assessment against your shortlist",
  );
  services.push("Onboarding workshop to map your deadlines and requirements");

  if (answers.stage === "applying") {
    services.push("Priority planning - we work backwards from your closest deadline");
  }

  services.push("Application portal setup and document submission");

  if (answers.essay === "none") {
    services.push(
      "Essay guidance to get your first draft started - you write it, we shape it",
    );
  } else {
    services.push("Essay editing and proofreading, our specialty");
  }

  if (answers.cv === "yes") {
    services.push("Resume / CV proofreading and editing");
  }

  services.push("Final review and application submission before the deadline");

  return {
    eligible: true,
    title: "You are a fit for our consulting",
    message: `Based on your answers, here is what your ${
      LEVEL_LABELS[answers.level]
    } application journey with us would cover once consulting opens:`,
    services,
    actions: [
      { label: "Get notified when we open", to: "/whatsapp" },
      { label: "Browse scholarships", to: "/scholarships", variant: "outline" },
      { label: "Ask us a question", to: "/contact", variant: "outline" },
    ],
  };
}

export default function EligibilityCheck() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  // Friendly quota message from the server (429) - shown above the fallback
  // result so the visitor knows when the personalized plan comes back.
  const [aiNotice, setAiNotice] = useState(null);

  useEffect(() => {
    let cancelled = false;
    assistantApi
      .status()
      .then((data) => {
        if (!cancelled && data?.enabled) setAiEnabled(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const total = QUESTIONS.length;
  const current = QUESTIONS[step];
  const result = useMemo(
    () => (submitted ? assess(answers) : null),
    [submitted, answers],
  );

  const runAi = (finalAnswers) => {
    setAiLoading(true);
    setAiNotice(null);
    assistantApi
      .assessment(finalAnswers)
      .then((data) => setAiResult(data))
      .catch((error) => {
        setAiResult(null);
        if (error?.status === 429 && error.message) setAiNotice(error.message);
      })
      .finally(() => setAiLoading(false));
  };

  const choose = (option) => {
    const next = { ...answers, [current.id]: option.value };
    setAnswers(next);
    if (option.terminal || step + 1 === total) {
      setSubmitted(true);
      // Terminal outcomes (too young, different goal) keep the honest static
      // answer; the personalized plan is for people we can actually help.
      if (!option.terminal && aiEnabled) runAi(next);
    } else {
      setStep(step + 1);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setSubmitted(false);
    setAiResult(null);
    setAiLoading(false);
    setAiNotice(null);
  };

  const progress = submitted ? 100 : Math.round((step / total) * 100);

  return (
    <section id="fit-check" className="bg-ink-50 py-16 sm:py-20">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">
            Quick check
          </p>
          <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
            Are we a fit for you?
          </h2>
          <p className="mt-4 text-ink-600">
            Six quick questions, about a minute. You&apos;ll get a personalized
            plan with scholarships from our board that match you. Your answers
            aren&apos;t stored - they only shape your result.
          </p>
        </div>

        <div className="surface mx-auto max-w-2xl overflow-hidden">
          {/* Progress rail */}
          <div className="h-1.5 bg-ink-100">
            <div
              className="h-full rounded-r-full bg-gradient-to-r from-brand-700 to-gold-400 transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-6 sm:p-8">
            {!submitted ? (
              <fieldset>
                <div className="mb-5 flex items-baseline justify-between gap-4">
                  <legend className="text-lg font-bold text-ink-900 sm:text-xl">
                    {current.question}
                  </legend>
                  <span className="shrink-0 text-sm font-medium text-ink-400">
                    {step + 1} / {total}
                  </span>
                </div>
                <p className="-mt-3 mb-5 text-sm text-ink-500">{current.help}</p>

                <div className="space-y-2.5">
                  {current.options.map((option) => {
                    const selected = answers[current.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => choose(option)}
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm transition-colors ${
                          selected
                            ? "border-brand-500 bg-brand-50 text-brand-900"
                            : "border-ink-200 bg-white text-ink-700 hover:border-brand-300 hover:bg-brand-50/50"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                            selected ? "border-brand-600" : "border-ink-300"
                          }`}
                        >
                          {selected && (
                            <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                          )}
                        </span>
                        <span className="font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>

                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep(step - 1)}
                    className="mt-6 rounded text-sm font-medium text-ink-500 underline-offset-4 hover:text-brand-700 hover:underline"
                  >
                    &larr; Back
                  </button>
                )}
              </fieldset>
            ) : aiLoading ? (
              <div className="py-10 text-center" aria-live="polite">
                <LoadingDots />
                <p className="mt-4 text-sm font-medium text-ink-600">
                  Building your personalized plan…
                </p>
                <p className="mt-1 text-xs text-ink-400">
                  Matching your answers with live scholarships on the board.
                </p>
              </div>
            ) : aiResult ? (
              <div aria-live="polite">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Personalized plan
                </span>

                <h3 className="mt-4 text-xl font-bold text-ink-900 sm:text-2xl">
                  {aiResult.headline}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {aiResult.summary}
                </p>

                {aiResult.next_steps?.length > 0 && (
                  <ol className="mt-5 space-y-2.5">
                    {aiResult.next_steps.map((stepText, index) => (
                      <li key={stepText} className="flex items-start gap-3 text-sm">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-100 text-xs font-bold text-gold-800">
                          {index + 1}
                        </span>
                        <span className="text-ink-700">{stepText}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {aiResult.scholarships?.length > 0 && (
                  <div className="mt-7">
                    <p className="text-sm font-semibold text-ink-900">
                      Live scholarships that match you
                    </p>
                    <ul className="mt-3 space-y-2">
                      {aiResult.scholarships.map((row) => (
                        <li key={row.id}>
                          <Link
                            to={`/scholarships/${row.id}`}
                            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm transition-colors hover:border-brand-300 hover:bg-brand-50/50"
                          >
                            <span className="font-medium text-brand-800">
                              {row.name}
                            </span>
                            <span className="text-xs text-ink-500">
                              {row.host_country} · {row.degree_level} · closes{" "}
                              {row.deadline}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-7 flex flex-wrap gap-3">
                  <Button to="/scholarships">Browse all scholarships</Button>
                  <Button to="/whatsapp" variant="outline">
                    Get notified when consulting opens
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={restart}
                  className="mt-6 rounded text-sm font-medium text-ink-500 underline-offset-4 hover:text-brand-700 hover:underline"
                >
                  Start over
                </button>
              </div>
            ) : (
              <div aria-live="polite">
                {aiNotice && (
                  <Alert tone="info" className="mb-5" title="Personalized plan paused">
                    {aiNotice} Here is your standard result in the meantime.
                  </Alert>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                    result.eligible
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gold-100 text-gold-900"
                  }`}
                >
                  {result.eligible ? "Good fit" : "Not a fit yet"}
                </span>

                <h3 className="mt-4 text-xl font-bold text-ink-900 sm:text-2xl">
                  {result.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-600">
                  {result.message}
                </p>

                {result.services && (
                  <ul className="mt-5 space-y-2.5">
                    {result.services.map((service) => (
                      <li key={service} className="flex items-start gap-2.5 text-sm">
                        <svg
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-ink-700">{service}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {result.actions.length > 0 && (
                  <div className="mt-7 flex flex-wrap gap-3">
                    {result.actions.map((action) => (
                      <Button
                        key={action.label}
                        to={action.to}
                        href={action.href}
                        variant={action.variant || "primary"}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Shown on every outcome: whatever the verdict on consulting,
                    the board and the community are open to everyone. */}
                <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50/70 p-5">
                  <p className="text-sm font-semibold text-brand-900">
                    Either way, keep going.
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                    The scholarship board is free to browse - no account, no fees - and
                    our WhatsApp community shares new opportunities, deadlines and
                    application tips every week.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button to="/scholarships" size="sm" variant="primary">
                      Browse scholarships
                    </Button>
                    <Button to="/whatsapp" size="sm" variant="outline">
                      Join the community
                    </Button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={restart}
                  className="mt-6 rounded text-sm font-medium text-ink-500 underline-offset-4 hover:text-brand-700 hover:underline"
                >
                  Start over
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
