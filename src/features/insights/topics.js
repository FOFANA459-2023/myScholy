/**
 * Topic design tokens for the Insights feed.
 *
 * Every topic carries one gradient, used consistently for its card rail, its
 * hero wash and its author avatar - so a reader learns "gold means interview
 * prep" without reading the chip. The gradients are all sampled from the
 * brand's navy-to-gold arc rather than being seven arbitrary hues, which is
 * what keeps a page of mixed topics reading as one publication.
 *
 * `value` mirrors Article.Topic on the backend; the server is the authority on
 * the full label, so `label` here is the short chip form.
 *
 * Two gradients per topic, because one cannot serve both surfaces. `gradient`
 * is tuned for white cards; on the deep-navy mastheads its darker stops turn
 * invisible (a navy spine on a navy field is nothing at all), so `onDark`
 * carries the same hue shifted into the light end of each ramp.
 */

const FALLBACK = {
  value: "applications",
  label: "Applications",
  gradient: "from-emerald-600 to-emerald-400",
  onDark: "from-emerald-400 to-emerald-200",
  chip: "success",
  icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6L19 9.4V19a2 2 0 0 1-2 2Z",
};

export const TOPICS = [
  {
    value: "essays",
    label: "Essays",
    gradient: "from-brand-800 to-brand-500",
    onDark: "from-brand-400 to-brand-200",
    chip: "brand",
    // Pen nib
    icon: "m16.9 3.6 3.5 3.5L8.5 19H5v-3.5L16.9 3.6ZM14.5 6l3.5 3.5",
  },
  {
    value: "interviews",
    label: "Interviews",
    gradient: "from-gold-600 to-gold-400",
    onDark: "from-gold-400 to-gold-200",
    chip: "gold",
    // Speech bubbles
    icon: "M8 10h8M8 14h5m-9 6V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-4 4Z",
  },
  {
    value: "applications",
    label: "Applications",
    gradient: "from-emerald-600 to-emerald-400",
    onDark: "from-emerald-400 to-emerald-200",
    chip: "success",
    // Document with lines
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.6L19 9.4V19a2 2 0 0 1-2 2Z",
  },
  {
    value: "scholarships",
    label: "Finding funding",
    gradient: "from-brand-700 to-gold-500",
    onDark: "from-brand-300 to-gold-300",
    chip: "brand",
    // Magnifier
    icon: "m21 21-4.3-4.3M17 11a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z",
  },
  {
    value: "tests",
    label: "Tests & exams",
    gradient: "from-cyan-600 to-teal-400",
    onDark: "from-cyan-400 to-teal-200",
    chip: "brand",
    // Checklist
    icon: "m4 7 2 2 3-3m-5 9 2 2 3-3m4-7h9m-9 8h9",
  },
  {
    value: "student_life",
    label: "Life abroad",
    gradient: "from-brand-500 to-emerald-400",
    onDark: "from-brand-300 to-emerald-300",
    chip: "success",
    // Globe
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.4 3.8-5.4 3.8-9S14.5 5.4 12 3c-2.5 2.4-3.8 5.4-3.8 9S9.5 18.6 12 21ZM3.5 9h17m-17 6h17",
  },
  {
    value: "stories",
    label: "Scholar stories",
    gradient: "from-gold-800 to-brand-700",
    onDark: "from-gold-300 to-brand-300",
    chip: "gold",
    // Quote mark
    icon: "M9 11H5.5A1.5 1.5 0 0 1 4 9.5V8a3 3 0 0 1 3-3m2 6v2a5 5 0 0 1-5 5m15-10h-3.5A1.5 1.5 0 0 1 14 9.5V8a3 3 0 0 1 3-3m2 6v2a5 5 0 0 1-5 5",
  },
];

const BY_VALUE = new Map(TOPICS.map((topic) => [topic.value, topic]));

/** Topic tokens for an article, falling back rather than rendering nothing if
 *  the backend ever grows a topic this build doesn't know about yet. */
export function topicOf(value) {
  return BY_VALUE.get(value) ?? { ...FALLBACK, value: value || FALLBACK.value };
}

/** Initials for the author avatar: "Amina Kollie" -> "AK". */
export function initialsOf(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
