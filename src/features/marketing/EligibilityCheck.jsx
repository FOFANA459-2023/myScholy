import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

import { Button, LoadingDots, MatchScore } from "../../components/ui/index.js";
import CountryFlag from "../../components/ui/CountryFlag.jsx";
import {
  assessment as assessmentApi,
  assistant as assistantApi,
} from "../../lib/api/endpoints.js";
import { formatShortDate } from "../../lib/format.js";
import { countryNames } from "../../lib/countryFlag.js";
import {
  ANY_FIELD,
  ANYWHERE,
  ENGLISH_TEST_OPTIONS,
  FIELDS_OF_STUDY,
  FUNDING_NEEDS,
  INTENDED_LEVELS,
  TARGET_REGIONS,
} from "../../lib/options.js";

/**
 * Get matched: six questions that rank the live board for you.
 *
 * This is the matcher's only surface, and it is behind the login gate -
 * the route wraps it in ProtectedRoute. Each question collects exactly one
 * signal `matching.py` scores on, and the board is re-scored after every
 * answer - which is what feeds the counter above the question. The counter is
 * the point of the whole design: the visitor watches a real number narrow
 * from "every live scholarship" to "the ones that fit you", so the reward for
 * answering is the answer itself rather than a progress bar.
 *
 * Two rules hold throughout:
 *
 * - The ranking is server-side and rule-based, so results are identical
 *   whether or not an AI key is configured. The written narrative is added on
 *   top when it is available and simply omitted when it is not.
 * - Answers are stored only for a signed-in student, onto their own Student
 *   row, where they make the recurring digest personal. Nothing is written
 *   down for anyone else.
 *
 * A note on the copy: none of the above is explained to the reader. There is
 * no profile page to send anyone to, and the machinery is not their problem -
 * so the text promises an outcome ("we'll email you new ones") rather than
 * describing storage or ranking. Keep it that way when editing.
 */

const QUESTIONS = [
  {
    id: "level",
    question: "What are you applying for?",
    help: "The level you want next - not the one you have now.",
    options: INTENDED_LEVELS,
  },
  {
    id: "citizenship",
    question: "What passport do you hold?",
    help: "Most scholarships only accept certain nationalities.",
    type: "country",
  },
  {
    id: "region",
    question: "Where would you like to study?",
    help: "Pick a region, or keep it open and see everything.",
    options: [
      { value: ANYWHERE, label: "Anywhere - show me everything" },
      ...TARGET_REGIONS.map((region) => ({ value: region, label: region })),
    ],
  },
  {
    id: "field",
    question: "What do you want to study?",
    help: "Broad is fine - your general subject area is enough.",
    options: [
      { value: ANY_FIELD, label: "Open to anything" },
      ...FIELDS_OF_STUDY.map((field) => ({ value: field, label: field })),
    ],
  },
  {
    id: "funding",
    question: "How much funding do you need?",
    help: "Be honest here - a partial award you cannot top up is not a win.",
    options: FUNDING_NEEDS,
  },
  {
    id: "english",
    question: "Do you have an IELTS or TOEFL score?",
    help: "So we can warn you before you get invested in one that needs it.",
    options: ENGLISH_TEST_OPTIONS,
  },
];

const LABELS = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.question]));

/** Short chip text for an answer, so the refine row stays scannable. */
function chipLabel(question, value) {
  if (question.type === "country") return value;
  const option = question.options.find((o) => o.value === value);
  return option ? option.label.split(" - ")[0] : value;
}

export default function EligibilityCheck() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  // Set while re-answering one question from the results screen; answering it
  // returns straight to the results rather than walking the rest again.
  const [editing, setEditing] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const [counts, setCounts] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(false);
  const [narrative, setNarrative] = useState(null);
  const [narrativeLoading, setNarrativeLoading] = useState(false);

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

  // The live counter. Runs on the empty answer set too, so the very first
  // question already sits under "N scholarships on the board".
  useEffect(() => {
    if (submitted) return undefined;
    const controller = new AbortController();
    assessmentApi
      .count(answers, { signal: controller.signal })
      .then((data) => setCounts(data))
      .catch(() => {});
    return () => controller.abort();
  }, [answers, submitted]);

  const runMatch = useCallback(
    (finalAnswers) => {
      setLoading(true);
      setFailed(false);
      assessmentApi
        .match(finalAnswers)
        .then((data) => {
          setResult(data);
          setCounts(data);
        })
        .catch(() => setFailed(true))
        .finally(() => setLoading(false));

      // Optional commentary. Never blocks the results, and its absence is not
      // an error state - the ranking and the reasons stand on their own.
      if (aiEnabled) {
        setNarrativeLoading(true);
        assistantApi
          .assessment(finalAnswers)
          .then((data) => setNarrative(data))
          .catch(() => setNarrative(null))
          .finally(() => setNarrativeLoading(false));
      }
    },
    [aiEnabled],
  );

  const total = QUESTIONS.length;
  const current = editing !== null ? QUESTIONS[editing] : QUESTIONS[step];

  const choose = (value) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);

    if (editing !== null) {
      setEditing(null);
      runMatch(next);
      return;
    }
    if (step + 1 === total) {
      setSubmitted(true);
      runMatch(next);
    } else {
      setStep(step + 1);
    }
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setEditing(null);
    setSubmitted(false);
    setResult(null);
    setNarrative(null);
    setCounts(null);
    setFailed(false);
  };

  const answering = !submitted || editing !== null;
  const progress = submitted ? 100 : Math.round((step / total) * 100);

  return (
    <section id="fit-check" className="bg-ink-50 py-16 sm:py-20">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gold-600">
            Scholarship match
          </p>
          <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
            Find the ones that actually fit you
          </h2>
          <p className="mt-4 text-ink-600">
            Six quick questions and we&rsquo;ll show you the scholarships worth
            your time &mdash; and why each one suits you.
          </p>
        </div>

        <div className="surface mx-auto max-w-2xl overflow-hidden">
          <div className="h-1.5 bg-ink-100">
            <div
              className="h-full rounded-r-full bg-gradient-to-r from-brand-700 to-gold-400 transition-[width] duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-6 sm:p-8">
            {answering ? (
              <>
                <NarrowingCounter counts={counts} answers={answers} />
                <Question
                  question={current}
                  value={answers[current.id]}
                  index={editing !== null ? editing : step}
                  total={total}
                  onChoose={choose}
                  onBack={
                    editing !== null
                      ? () => setEditing(null)
                      : step > 0
                        ? () => setStep(step - 1)
                        : null
                  }
                  backLabel={editing !== null ? "Back to results" : "Back"}
                />
              </>
            ) : loading ? (
              <div className="py-10 text-center" aria-live="polite">
                <LoadingDots />
                <p className="mt-4 text-sm font-medium text-ink-600">
                  Finding your scholarships…
                </p>
              </div>
            ) : failed ? (
              <div aria-live="polite" className="py-8 text-center">
                <p className="text-sm text-ink-600">
                  Something went wrong on our side just now.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button onClick={() => runMatch(answers)}>Try again</Button>
                  <Button to="/scholarships" variant="outline">
                    Browse the board instead
                  </Button>
                </div>
              </div>
            ) : (
              <Results
                result={result}
                answers={answers}
                narrative={narrative}
                narrativeLoading={narrativeLoading}
                onEdit={setEditing}
                onRestart={restart}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The live count of scholarships matching everything answered so far.
 *
 * Counts `exact_count` rather than `match_count` on purpose. Only a few
 * signals actually disqualify a listing (level, citizenship, an age or test
 * requirement), so "how many are you not blocked from" barely moves as you
 * answer - whereas "how many satisfy every preference you have stated"
 * narrows with each one. It is the same server-side matcher either way, so
 * the number they watch is a real number, not a progress animation.
 */
function NarrowingCounter({ counts, answers }) {
  const answered = Object.keys(answers).length;

  const count = counts?.exact_count;
  const total = counts?.total_live;

  if (typeof count !== "number" || typeof total !== "number") {
    return <div className="mb-6 h-14" aria-hidden="true" />;
  }

  const narrowing = answered > 0;

  return (
    <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3">
      <p aria-live="polite" className="text-sm text-brand-900">
        <span className="text-2xl font-bold tabular-nums text-brand-800 transition-all duration-300">
          {count}
        </span>{" "}
        <span className="font-medium">
          {count === 1 ? "scholarship" : "scholarships"}
          {narrowing
            ? ` of ${total} still tick${count === 1 ? "s" : ""} every box`
            : " open right now"}
        </span>
      </p>
      {narrowing && (
        <div
          className="mt-2 h-1 w-full overflow-hidden rounded-full bg-brand-200/70"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-brand-700 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.max(2, Math.round((count / total) * 100))}%` }}
          />
        </div>
      )}
      {narrowing && count === 0 && (
        <p className="mt-1.5 text-xs text-brand-800">
          None tick every box &mdash; we&rsquo;ll still show you the closest
          ones.
        </p>
      )}
    </div>
  );
}

function Question({ question, value, index, total, onChoose, onBack, backLabel }) {
  return (
    <fieldset>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <legend className="text-lg font-bold text-ink-900 sm:text-xl">
          {question.question}
        </legend>
        <span className="shrink-0 text-sm font-medium text-ink-400">
          {index + 1} / {total}
        </span>
      </div>
      <p className="-mt-3 mb-5 text-sm text-ink-500">{question.help}</p>

      {question.type === "country" ? (
        <CountryAnswer value={value} onChoose={onChoose} />
      ) : (
        <div className="space-y-2.5">
          {question.options.map((option) => {
            const selected = value === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChoose(option.value)}
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
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                </span>
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mt-6 rounded text-sm font-medium text-ink-500 underline-offset-4 hover:text-brand-700 hover:underline"
        >
          &larr; {backLabel}
        </button>
      )}
    </fieldset>
  );
}

/**
 * Citizenship, the one answer that cannot be a shortlist of buttons.
 *
 * Free text against a datalist of every country name, so any nationality can
 * answer without us curating a list - and the flag confirms we understood
 * them before they commit.
 */
function CountryAnswer({ value, onChoose }) {
  const [text, setText] = useState(value || "");

  const submit = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (trimmed) onChoose(trimmed);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 focus-within:border-brand-400">
        <CountryFlag country={text} className="shrink-0" />
        <input
          type="text"
          list="assessment-countries"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Start typing your country"
          aria-label="Country of citizenship"
          autoComplete="country-name"
          className="w-full border-0 bg-transparent py-3.5 text-sm text-ink-800 outline-none placeholder:text-ink-400"
        />
      </div>
      <datalist id="assessment-countries">
        {countryNames().map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <Button type="submit" disabled={!text.trim()} fullWidth>
        Continue
      </Button>
    </form>
  );
}

/** One labelled group of result cards, headed by its own count. */
function MatchGroup({ heading, note, rows }) {
  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-ink-900">{heading}</p>
      {note && <p className="mt-0.5 text-xs text-ink-500">{note}</p>}
      <ul className="mt-3 space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              to={`/scholarships/${row.slug || row.id}`}
              className="block rounded-xl border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-brand-800">{row.name}</span>
                <MatchScore score={row.match_score} className="shrink-0" />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-500">
                <CountryFlag country={row.host_country} />
                {row.host_country} · {row.degree_level} · closes{" "}
                {formatShortDate(row.deadline)}
              </p>
              {row.match_reasons?.length > 0 && (
                <ul className="mt-2.5 space-y-1">
                  {row.match_reasons.slice(0, 3).map((reason) => (
                    <li key={reason} className="flex gap-2 text-xs text-ink-600">
                      <span aria-hidden="true" className="text-emerald-600">
                        &#10003;
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Results({
  result,
  answers,
  narrative,
  narrativeLoading,
  onEdit,
  onRestart,
}) {
  // Whether the answers were remembered. False for a signed-in account with
  // no student profile, which is the only signed-in case that cannot be.
  const saved = result?.saved_to_profile ?? false;
  const results = result?.results ?? [];
  const blocked = result?.blocked_count ?? 0;

  // Split so every heading sits directly above the listings it counts. When
  // one number described the perfect matches and the list below mixed those
  // with the near-misses, the count never matched what you could see on
  // screen - which reads as a bug even though both numbers were right.
  const perfect = results.filter((row) => row.is_exact);
  const close = results.filter((row) => !row.is_exact);

  return (
    <div aria-live="polite">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
        Your matches
      </span>

      <h3 className="mt-4 text-xl font-bold text-ink-900 sm:text-2xl">
        {narrative?.headline ||
          (results.length === 0
            ? "Nothing fits this yet"
            : perfect.length > 0
              ? "Here's what fits you"
              : "Nothing ticks every box, but these come close")}
      </h3>

      {narrativeLoading ? (
        <p className="mt-3 text-sm text-ink-400">Writing your summary…</p>
      ) : narrative?.summary ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{narrative.summary}</p>
      ) : (
        <p className="mt-3 text-sm leading-relaxed text-ink-600">
          {results.length === 0
            ? "Nothing on the board suits this right now. Change an answer below and see what opens up."
            : "Each one tells you why it fits. Change any answer below to see how your list shifts."}
        </p>
      )}

      {/* Refine row: the loop that keeps people here. Changing one answer
          re-ranks immediately instead of restarting the whole quiz. */}
      <div className="mt-5 flex flex-wrap gap-2">
        {QUESTIONS.map((question, index) =>
          answers[question.id] ? (
            <button
              key={question.id}
              type="button"
              onClick={() => onEdit(index)}
              title={`Change: ${LABELS[question.id]}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
            >
              {chipLabel(question, answers[question.id])}
              <span aria-hidden="true" className="text-ink-400">
                &#9998;
              </span>
            </button>
          ) : null,
        )}
      </div>

      {perfect.length > 0 && (
        <MatchGroup
          heading={
            perfect.length === 1
              ? "1 scholarship ticks every box"
              : `${perfect.length} scholarships tick every box`
          }
          rows={perfect}
        />
      )}

      {close.length > 0 && (
        <MatchGroup
          heading={
            close.length === 1
              ? "1 more worth a look"
              : `${close.length} more worth a look`
          }
          note="These miss something you asked for, but are still open to you."
          rows={close}
        />
      )}

      {narrative?.next_steps?.length > 0 && (
        <div className="mt-7">
          <p className="text-sm font-semibold text-ink-900">What to do next</p>
          <ol className="mt-3 space-y-2.5">
            {narrative.next_steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-100 text-xs font-bold text-gold-800">
                  {index + 1}
                </span>
                <span className="text-ink-700">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {blocked > 0 && (
        <p className="mt-5 text-xs text-ink-500">
          We left out {blocked} other{" "}
          {blocked === 1 ? "scholarship" : "scholarships"} that{" "}
          {blocked === 1 ? "asks" : "ask"} for something you told us you
          don&rsquo;t have.{" "}
          <Link
            to="/scholarships"
            className="font-medium text-brand-800 underline underline-offset-4"
          >
            See the full board
          </Link>{" "}
          if you want to judge them yourself.
        </p>
      )}

      {/* The conversion step, and the honest reason for it: an account is
          what lets these results come back to you without returning here. */}
      <div className="mt-7 rounded-xl border border-brand-200 bg-brand-50/70 p-5">
        {saved ? (
          <>
            <p className="text-sm font-semibold text-brand-900">
              We&rsquo;ll keep watching for you.
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              New scholarships that suit you will come straight to your inbox,
              so you don&rsquo;t have to keep checking. Come back and change
              your answers any time your plans do.
            </p>
            <div className="mt-4">
              <Button to="/whatsapp" size="sm" variant="outline">
                Join the WhatsApp community
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Reached by a signed-in account with no student profile - an
                admin trying the quiz. The results are real; there is simply
                nowhere to remember them, so we do not promise the emails. */}
            <p className="text-sm font-semibold text-brand-900">
              This one is just for a look.
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
              We can&rsquo;t send matches to this account, so these answers
              won&rsquo;t be remembered. Students who take it get new matches
              emailed to them as they come up.
            </p>
          </>
        )}
      </div>

      <p className="mt-5 text-xs text-ink-500">
        We read the requirements from each announcement, so we can get one
        wrong. Always double-check on the official page before you apply.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Button to="/scholarships" variant="outline" size="sm">
          Browse all scholarships
        </Button>
        <button
          type="button"
          onClick={onRestart}
          className="rounded text-sm font-medium text-ink-500 underline-offset-4 hover:text-brand-700 hover:underline"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
