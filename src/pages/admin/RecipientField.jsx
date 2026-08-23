import React, { useMemo, useRef, useState } from "react";

import cn from "../../lib/cn.js";
import { Badge } from "../../components/ui/index.js";

/**
 * The composer's "To" field: one control that takes either a group or an
 * address.
 *
 * Typing filters the group tags live, so reaching every student is "type stu,
 * press Enter" rather than pasting a list. Anything that looks like an email
 * address is accepted as itself, which keeps one-off messages working exactly
 * as before.
 *
 * Only one recipient at a time is selectable, because that is what the API
 * accepts - a message goes to one address or one group, never a mix. The
 * control makes that visible rather than letting an admin build a selection
 * the server will reject.
 *
 * `value` is `{type: "audience"|"email", value: string}` or null.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function RecipientField({
  audiences = [],
  value,
  onChange,
  error,
  disabled,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);

  const trimmed = query.trim();

  const matches = useMemo(() => {
    const needle = trimmed.toLowerCase();
    if (!needle) return audiences;
    return audiences.filter(
      (audience) =>
        audience.label.toLowerCase().includes(needle) ||
        audience.value.toLowerCase().includes(needle),
    );
  }, [audiences, trimmed]);

  const looksLikeEmail = EMAIL_RE.test(trimmed);
  // The typed address is offered as its own option beneath the group matches.
  const options = useMemo(
    () => [
      ...matches.map((audience) => ({ type: "audience", audience })),
      ...(looksLikeEmail ? [{ type: "email", email: trimmed }] : []),
    ],
    [matches, looksLikeEmail, trimmed],
  );

  const choose = (option) => {
    onChange(
      option.type === "audience"
        ? { type: "audience", value: option.audience.value }
        : { type: "email", value: option.email },
    );
    setQuery("");
    setOpen(false);
    setHighlight(0);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setHighlight((current) => {
        const next = event.key === "ArrowDown" ? current + 1 : current - 1;
        if (options.length === 0) return 0;
        return (next + options.length) % options.length;
      });
      return;
    }
    if (event.key === "Enter") {
      // Never let a stray Enter in the recipient box submit a half-written
      // message to every student.
      event.preventDefault();
      if (options[highlight]) choose(options[highlight]);
      return;
    }
    if (event.key === "Escape") setOpen(false);
    if (event.key === "Backspace" && !query && value) onChange(null);
  };

  const selected = value?.type === "audience"
    ? audiences.find((audience) => audience.value === value.value)
    : null;

  return (
    <div className="space-y-1.5">
      <label htmlFor="recipient" className="block text-sm font-medium text-ink-700">
        To
        <span className="ml-0.5 text-red-500" aria-hidden="true">
          *
        </span>
      </label>

      <div className="relative">
        <div
          className={cn(
            "flex min-h-[2.75rem] flex-wrap items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 transition-colors",
            error ? "border-red-400 bg-red-50/40" : "border-ink-300 hover:border-ink-400",
            disabled && "cursor-not-allowed bg-ink-100",
          )}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          {value && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full py-1 pl-2.5 pr-1.5 text-sm font-medium",
                value.type === "audience"
                  ? "bg-brand-50 text-brand-800 ring-1 ring-inset ring-brand-200"
                  : "bg-ink-100 text-ink-800",
              )}
            >
              {value.type === "audience" && (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M13 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm9 13v-1a4 4 0 0 0-3-3.9M16 3.6a4 4 0 0 1 0 7"
                  />
                </svg>
              )}
              {selected ? selected.label : value.value}
              {selected && (
                <span className="text-xs font-normal text-brand-600">
                  {selected.count}
                </span>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(null);
                  inputRef.current?.focus();
                }}
                disabled={disabled}
                aria-label="Remove recipient"
                className="rounded-full p-0.5 opacity-60 transition-opacity hover:opacity-100"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </span>
          )}

          <input
            ref={inputRef}
            id="recipient"
            type="text"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls="recipient-options"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "recipient-error" : "recipient-hint"}
            value={query}
            disabled={disabled}
            placeholder={
              value ? "" : "Type a group (e.g. students) or an email address"
            }
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onKeyDown={handleKeyDown}
            className="min-w-[12rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0"
          />
        </div>

        {open && options.length > 0 && (
          <ul
            id="recipient-options"
            role="listbox"
            className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-72 overflow-auto rounded-xl border border-ink-200/70 bg-white py-1.5 shadow-card-hover"
          >
            {matches.length > 0 && (
              <li className="px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-400">
                Groups
              </li>
            )}
            {options.map((option, index) => {
              const isAudience = option.type === "audience";
              return (
                <li key={isAudience ? option.audience.value : "typed-email"}>
                  {!isAudience && (
                    <span className="block px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-ink-400">
                      Individual
                    </span>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === highlight}
                    onMouseEnter={() => setHighlight(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(option)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors",
                      index === highlight ? "bg-brand-50" : "hover:bg-ink-50",
                    )}
                  >
                    {isAudience ? (
                      <>
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-ink-900">
                            {option.audience.label}
                          </span>
                          <span className="block truncate text-xs text-ink-500">
                            {option.audience.description}
                          </span>
                        </span>
                        <Badge tone={option.audience.count > 0 ? "brand" : "neutral"}>
                          {option.audience.count}
                        </Badge>
                      </>
                    ) : (
                      <span className="text-sm text-ink-900">
                        Send to <span className="font-medium">{option.email}</span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {error ? (
        <p id="recipient-error" className="text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        <p id="recipient-hint" className="text-xs text-ink-500">
          Pick a group to reach everyone in it at once, or type one email
          address. Each person receives their own copy.
        </p>
      )}
    </div>
  );
}
