import React from "react";
import { Link } from "react-router";

/**
 * Tiny renderer for the subset of markdown the assistant is told to use:
 * paragraphs, "-"/"*"/"1." lists, **bold**, [text](url) links, and bare URLs.
 * Everything is built as React elements - no HTML injection is possible, so
 * model output can never smuggle markup into the page.
 *
 * Links render brand-blue. Links into the site itself (a "/path" or a full
 * myScholy URL) use the router so navigating keeps the chat open; external
 * links open in a new tab.
 */

const LINK_CLASS =
  "font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800";

const SITE_HOSTS = /^https?:\/\/(www\.)?(myscholy\.pages\.dev|localhost:\d+)/i;

// [text](url) | **bold** | bare URL
const INLINE_RE = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s<>)"']+)/g;

function renderLink(href, label, key) {
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
        <strong key={key} className="font-semibold">
          {match[3]}
        </strong>,
      );
    } else {
      // Sentence punctuation glued to a bare URL is prose, not address.
      let url = match[4];
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

const LIST_ITEM_RE = /^\s*(?:[-*]|\d+[.)])\s+/;

export default function AssistantMarkdown({ text }) {
  const lines = String(text || "").split("\n");
  const blocks = [];
  let list = null;

  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", items: list });
      list = null;
    }
  };

  for (const line of lines) {
    if (LIST_ITEM_RE.test(line)) {
      (list ??= []).push(line.replace(LIST_ITEM_RE, ""));
    } else {
      flushList();
      if (line.trim()) blocks.push({ type: "p", text: line });
    }
  }
  flushList();

  return (
    <div className="space-y-2">
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={index} className="space-y-1 pl-1">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex gap-2">
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"
                />
                <span>{renderInline(item, `${index}-${itemIndex}`)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>{renderInline(block.text, String(index))}</p>
        ),
      )}
    </div>
  );
}
