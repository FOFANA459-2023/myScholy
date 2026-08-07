import React from "react";
import ReactCountryFlag from "react-country-flag";

import { countryCodeFor, firstHostCountry } from "../../lib/countryFlag.js";

/**
 * SVG flag for a scholarship's host country (the first one, when several are
 * listed). Renders nothing when the name cannot be resolved to an ISO code -
 * a missing flag is better than a wrong one.
 */
export default function CountryFlag({ country, className }) {
  const code = countryCodeFor(country);
  if (!code) return null;

  return (
    <ReactCountryFlag
      countryCode={code}
      svg
      title={firstHostCountry(country)}
      aria-label={`${firstHostCountry(country)} flag`}
      className={className}
      style={{ width: "1.25em", height: "0.9375em", borderRadius: "2px" }}
    />
  );
}
