import React, { useState } from "react";

import cn from "../../lib/cn.js";
import { imageUrl } from "../../lib/api/endpoints.js";
import { initialsOf, topicOf } from "./topics.js";

const SIZES = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
  // The article masthead's portrait: large enough to read as a photograph of
  // a person rather than as a byline decoration.
  "2xl": "h-28 w-28 text-3xl sm:h-36 sm:w-36 sm:text-4xl",
};

// Circles read as bylines; a rounded rectangle reads as a portrait, which is
// what the article masthead wants from the same component.
const SHAPES = {
  circle: "rounded-full",
  portrait: "rounded-2xl",
};

/**
 * The writer's photo, or their initials on the topic's gradient.
 *
 * Initials are the fallback rather than a grey silhouette: mentors and guest
 * writers often have no headshot to send, and a generic placeholder on every
 * byline reads as missing data. Initials on the topic colour look deliberate
 * and tie the byline to the piece.
 *
 * A photo that fails to load falls back to the initials too, so a deleted or
 * broken image never leaves a torn-image icon in a byline.
 */
export default function AuthorAvatar({
  name,
  topic,
  photo,
  size = "md",
  shape = "circle",
  eager = false,
  className,
}) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : imageUrl(photo);
  const sizeClass = SIZES[size] ?? SIZES.md;
  const shapeClass = SHAPES[shape] ?? SHAPES.circle;

  if (src) {
    return (
      <img
        src={src}
        // Decorative: every place this renders prints the writer's name as
        // adjacent text, so alt text here would only repeat it.
        alt=""
        // The masthead portrait is above the fold; deferring it leaves a hole
        // in the hero on first paint.
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className={cn(
          "shrink-0 object-cover ring-2 ring-white",
          shapeClass,
          sizeClass,
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-gradient-to-br font-semibold tracking-wide text-white shadow-sm ring-2 ring-white",
        shapeClass,
        topicOf(topic).gradient,
        sizeClass,
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
