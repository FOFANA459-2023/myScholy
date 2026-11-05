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

/**
 * Matching preferences. Every `value` below must match the corresponding
 * TextChoices on the Django models exactly - the backend stores these strings
 * verbatim and `matching.py` compares against them.
 */

/** Mirrors Student.IntendedLevel, whose values are the categories
 *  filters.classify_degree() produces on the scholarship side. */
export const INTENDED_LEVELS = [
  { value: "Undergraduate", label: "Undergraduate" },
  { value: "Graduate", label: "Graduate (Masters)" },
  { value: "Postgraduate", label: "Postgraduate (PhD, fellowship)" },
  { value: "Non-degree", label: "Non-degree (certificate, exchange)" },
];

/** Mirrors filters.REGIONS - the regions the board groups countries into. */
export const TARGET_REGIONS = [
  "Africa",
  "Europe",
  "Australia",
  "Asia",
  "United States",
  "Canada",
];

/** Mirrors Student.EnglishTestStatus. */
export const ENGLISH_TEST_OPTIONS = [
  { value: "have", label: "I have an IELTS/TOEFL score" },
  { value: "none", label: "I do not have one yet" },
];

/** Mirrors Student.FundingNeed. */
export const FUNDING_NEEDS = [
  { value: "full_only", label: "Only fully funded" },
  { value: "prefer_full", label: "Prefer fully funded" },
  { value: "any", label: "Any funding helps" },
];

/** Mirrors Scholarship.FundingType (admin posting form). */
export const FUNDING_TYPES = [
  { value: "full", label: "Fully funded" },
  { value: "partial", label: "Partially funded" },
  { value: "tuition", label: "Tuition only" },
  { value: "stipend", label: "Stipend only" },
];

/** Mirrors Scholarship.EnglishTest (admin posting form). */
export const ENGLISH_TEST_REQUIREMENTS = [
  { value: "required", label: "Required" },
  { value: "not_required", label: "Not required" },
];

/**
 * The assessment's explicit "no preference" answers.
 *
 * These must widen the search rather than narrow it, so the backend strips
 * them before matching (see matching.ANYWHERE / matching.ANY_FIELD). The
 * strings have to stay identical on both sides.
 */
export const ANYWHERE = "Anywhere";
export const ANY_FIELD = "Any";

/** Broad subject groups, matched against a listing's `fields_of_study` by
 *  substring - so "engineering" also catches "civil engineering". */
export const FIELDS_OF_STUDY = [
  "Engineering",
  "Computer science",
  "Business",
  "Health and medicine",
  "Natural sciences",
  "Social sciences",
  "Law",
  "Arts and humanities",
  "Education",
  "Agriculture",
];
