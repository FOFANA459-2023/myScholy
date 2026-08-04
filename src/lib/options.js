/**
 * Shared option lists for form selects.
 *
 * Kept out of the page components so the values can be imported without
 * dragging a component along (and so React Fast Refresh keeps working).
 */

/** Mirrors Student.EducationLevel on the backend - values must match exactly. */
export const EDUCATION_LEVELS = [
  { value: "high_school", label: "High school" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "graduate", label: "Graduate" },
];

export const EDUCATION_LEVEL_VALUES = EDUCATION_LEVELS.map((option) => option.value);

export const EDUCATION_LEVEL_LABELS = Object.fromEntries(
  EDUCATION_LEVELS.map((option) => [option.value, option.label]),
);
