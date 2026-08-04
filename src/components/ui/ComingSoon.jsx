import React from "react";

import Button from "./Button.jsx";
import Note from "./Note.jsx";

/** Where to send someone who has just been told the service is not open yet. */
const WHILE_YOU_WAIT = [
  { label: "Browse scholarships", to: "/scholarships" },
  { label: "Join the community", to: "/whatsapp", variant: "outline" },
  { label: "Contact us", to: "/contact", variant: "outline" },
];

/**
 * The banner that marks a service as not yet open - a `Note` that ends with
 * somewhere to go.
 *
 * Consulting and the Academy both use it, so the two read as the same promise
 * rather than two different degrees of "soon". It sits above the page's
 * descriptive content instead of replacing it: someone landing here should
 * still be able to read exactly what the service will be, and decide whether
 * it is worth waiting for.
 *
 * Being told to wait is a dead end on its own, so the board, the community and
 * the contact form - all available right now - close every instance.
 */
export default function ComingSoon({ children, label = "Coming soon", className }) {
  return (
    <Note label={label} className={className}>
      {children}

      <div>
        <p className="text-sm font-semibold text-brand-900">In the meantime</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {WHILE_YOU_WAIT.map((action) => (
            <Button key={action.to} to={action.to} variant={action.variant}>
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </Note>
  );
}
