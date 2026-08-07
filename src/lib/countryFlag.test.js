import { describe, expect, it } from "vitest";

import { countryCodeFor, firstHostCountry } from "./countryFlag.js";

describe("firstHostCountry", () => {
  it("returns single names unchanged", () => {
    expect(firstHostCountry("China")).toBe("China");
  });

  it("takes the first country when several are listed", () => {
    expect(firstHostCountry("United States & United Kingdom")).toBe("United States");
    expect(firstHostCountry("Rwanda / Mauritius")).toBe("Rwanda");
    expect(firstHostCountry("Germany, France and Spain")).toBe("Germany");
  });

  it("handles empty input", () => {
    expect(firstHostCountry("")).toBe("");
    expect(firstHostCountry(null)).toBe("");
  });
});

describe("countryCodeFor", () => {
  it("resolves official English names", () => {
    expect(countryCodeFor("United Kingdom")).toBe("GB");
    expect(countryCodeFor("China")).toBe("CN");
    expect(countryCodeFor("Portugal")).toBe("PT");
    expect(countryCodeFor("Canada")).toBe("CA");
  });

  it("resolves the first of several countries", () => {
    expect(countryCodeFor("United States & United Kingdom")).toBe("US");
  });

  it("resolves informal aliases", () => {
    expect(countryCodeFor("UK")).toBe("GB");
    expect(countryCodeFor("USA")).toBe("US");
    expect(countryCodeFor("South Korea")).toBe("KR");
    expect(countryCodeFor("Ivory Coast")).toBe("CI");
  });

  it("returns null for unresolvable names", () => {
    expect(countryCodeFor("Atlantis")).toBeNull();
    expect(countryCodeFor("")).toBeNull();
    expect(countryCodeFor(null)).toBeNull();
  });
});
