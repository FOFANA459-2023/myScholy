import React from "react";
import { Link } from "react-router";

/**
 * Long-form renderer for article bodies.
 *
 * A sibling of `assistant/assistantMarkdown.jsx` rather than a reuse of it:
 * that one renders short chat turns at chat density and only knows
 * paragraphs, lists, bold and links. An article needs section headings, pull
 * quotes, rules and editorial spacing, so the two have genuinely different
 * jobs and neither wants the other's line-height.
 *
 * What they do share is the security property: every node is built as a React
 * element and nothing is ever passed to dangerouslySetInnerHTML, so a body
 * typed into the admin form can never inject markup into the page.
 *
 * Supported syntax (documented for admins in the form's hint text):
 *   ## Heading          ### Smaller heading
 *   - bullet            1. numbered
 *   > pull quote        ---  (divider)
 *   **bold**   *italic*   [text](url)   bare URLs
 */

const LINK_CLASS =
  "font-medium text-brand-700 underline underline-offset-2 transition-colors hover:text-brand-900";

const SITE_HOSTS = /^https?:\/\/(www\.)?(myscholy\.pages\.dev|localhost:\d+)/i;

// [text](url) | **bold** | *italic* | bare URL
const INLINE_RE =
  /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*|(https?:\/\/[^\s<>)"']+)/g;

function renderLink(href, label, key) {
  // Internal links go through the router so navigation stays client-side;
  // anything else opens in a new tab.
  const internal = href.startsWith("/")
    ? href
    : SITE_HOSTS.test(href)
      ? href.replace(SITE_HOSTS, "") || "/"
      : null;
  if (internal !== null) {
    return (
      <Link key={key} to={internal} className={LINK_CLASS}>
        {label}
      </Link>
    );
  }
  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={LINK_CLASS}
    >
      {label}
    </a>
  );
}

function renderInline(text, keyPrefix) {
  const nodes = [];
  let last = 0;
  let match;
  let i = 0;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = `${keyPrefix}-${i++}`;
    if (match[1] !== undefined) {
      nodes.push(renderLink(match[2], match[1], key));
    } else if (match[3] !== undefined) {
      nodes.push(
        <strong key={key} className="font-semibold text-ink-900">
          {match[3]}
        </strong>,
      );
    } else if (match[4] !== undefined) {
      nodes.push(<em key={key}>{match[4]}</em>);
    } else {
      // Sentence punctuation glued to a bare URL is prose, not address.
      let url = match[5];
      const trailing = url.match(/[.,!?;:]+$/);
      let rest = "";
      if (trailing) {
        rest = trailing[0];
        url = url.slice(0, -rest.length);
      }
      nodes.push(renderLink(url, url, key));
      if (rest) nodes.push(rest);
    }
    last = INLINE_RE.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const BULLET_RE = /^\s*[-*]\s+/;
const NUMBER_RE = /^\s*\d+[.)]\s+/;

/** Group the raw lines into blocks: headings, lists, quotes, rules, paragraphs. */
function parse(text) {
  const lines = String(text || "").split("\n");
  const blocks = [];
  let list = null;
  let quote = null;

  const flush = () => {
    if (list) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items });
      list = null;
    }
    if (quote) {
      blocks.push({ type: "quote", text: quote.join(" ") });
      quote = null;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      flush();
      continue;
    }
    if (/^---+$/.test(trimmed)) {
      flush();
      blocks.push({ type: "rule" });
      continue;
    }
    if (trimmed.startsWith("#")) {
      flush();
      const level = trimmed.match(/^#+/)[0].length;
      blocks.push({
        type: "heading",
        level: Math.min(Math.max(level, 2), 3),
        text: trimmed.replace(/^#+\s*/, ""),
      });
      continue;
    }
    if (trimmed.startsWith(">")) {
      if (list) flush();
      (quote ??= []).push(trimmed.replace(/^>\s?/, ""));
      continue;
    }
    if (BULLET_RE.test(line) || NUMBER_RE.test(line)) {
      if (quote) flush();
      const ordered = NUMBER_RE.test(line);
      // A change of list type starts a new list rather than mixing markers.
      if (list && list.ordered !== ordered) flush();
      (list ??= { ordered, items: [] }).items.push(
        line.replace(ordered ? NUMBER_RE : BULLET_RE, ""),
      );
      continue;
    }

    flush();
    blocks.push({ type: "p", text: trimmed });
  }

  flush();
  return blocks;
}

export default function ArticleBody({ text }) {
  const blocks = parse(text);
  // The drop cap belongs to the opening paragraph only - and only when the
  // piece actually opens with prose rather than a heading or a quote.
  const leadIndex = blocks.findIndex((block) => block.type === "p");

  return (
    <div className="text-[1.0625rem] leading-[1.75] text-ink-700">
      {blocks.map((block, index) => {
        const key = index;

        if (block.type === "rule") {
          return (
            <hr key={key} className="my-10 border-0 border-t border-ink-200" />
          );
        }

        if (block.type === "heading") {
          return block.level === 2 ? (
            <h2
              key={key}
              className="mt-10 text-xl font-bold text-ink-900 sm:text-2xl"
            >
              {renderInline(block.text, String(key))}
            </h2>
          ) : (
            <h3 key={key} className="mt-8 text-lg font-semibold text-ink-900">
              {renderInline(block.text, String(key))}
            </h3>
          );
        }

        if (block.type === "quote") {
          return (
            <blockquote
              key={key}
              className="my-8 border-l-4 border-gold-500 bg-gold-50/60 py-4 pl-5 pr-4 text-lg font-medium italic leading-relaxed text-ink-800 sm:pl-6"
            >
              {renderInline(block.text, String(key))}
            </blockquote>
          );
        }

        if (block.type === "list") {
          const Tag = block.ordered ? "ol" : "ul";
          return (
            <Tag key={key} className="my-5 space-y-2.5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className={
                      block.ordered
                        ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-800"
                        : "mt-[0.6875rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
                    }
                  >
                    {block.ordered ? itemIndex + 1 : null}
                  </span>
                  <span>{renderInline(item, `${key}-${itemIndex}`)}</span>
                </li>
              ))}
            </Tag>
          );
        }

        return (
          <p
            key={key}
            className={
              index === leadIndex
                ? "mt-0 [&::first-letter]:float-left [&::first-letter]:mr-2.5 [&::first-letter]:mt-1 [&::first-letter]:font-bold [&::first-letter]:text-[3.25rem] [&::first-letter]:leading-[0.82] [&::first-letter]:text-brand-800"
                : "mt-5"
            }
          >
            {renderInline(block.text, String(key))}
          </p>
        );
      })}
    </div>
  );
}
