/**
 * Country-name -> ISO 3166-1 alpha-2 resolution for flag rendering.
 *
 * Host countries are free text ("United Kingdom", "United States & United
 * Kingdom", "Rwanda / Mauritius"). The rule: take the FIRST country named,
 * resolve it through i18n-iso-countries (English names, official and common),
 * then a small alias table for informal spellings the library does not know.
 * Unresolvable names yield null and the card simply shows no flag.
 */

import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

// Informal names admins actually type, mapped to ISO codes.
const ALIASES = {
  uk: "GB",
  "the uk": "GB",
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "great britain": "GB",
  usa: "US",
  us: "US",
  "the usa": "US",
  america: "US",
  "united states of america": "US",
  uae: "AE",
  "south korea": "KR",
  "north korea": "KP",
  russia: "RU",
  turkey: "TR",
  "czech republic": "CZ",
  "ivory coast": "CI",
  vietnam: "VN",
  laos: "LA",
  syria: "SY",
  iran: "IR",
  tanzania: "TZ",
  venezuela: "VE",
  bolivia: "BO",
  moldova: "MD",
  brunei: "BN",
  "hong kong": "HK",
  macau: "MO",
  palestine: "PS",
  "cape verde": "CV",
  "dr congo": "CD",
  "democratic republic of congo": "CD",
  "republic of congo": "CG",
  netherlands: "NL",
  "the netherlands": "NL",
  philippines: "PH",
  "the philippines": "PH",
};

/** First country named in a possibly multi-country host string. */
export function firstHostCountry(hostCountry) {
  if (!hostCountry) return "";
  return String(hostCountry)
    .split(/\s*(?:&|,|\/|;|\+|\band\b|\bor\b)\s*/i)[0]
    .trim();
}

/** ISO alpha-2 code for the first host country, or null when unresolvable. */
export function countryCodeFor(hostCountry) {
  const first = firstHostCountry(hostCountry);
  if (!first) return null;
  return (
    countries.getAlpha2Code(first, "en") ||
    ALIASES[first.toLowerCase()] ||
    null
  );
}
