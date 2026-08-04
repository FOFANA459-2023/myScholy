import { describe, expect, it } from "vitest";

import {
  choice,
  collect,
  email,
  flattenFieldErrors,
  maxLength,
  minLength,
  name,
  password,
  passwordConfirmation,
  phone,
  required,
  url,
} from "./validation.js";

describe("email", () => {
  it("accepts normal addresses, plus tags and subdomains", () => {
    expect(email("ama@example.com")).toBeUndefined();
    expect(email("a.b+tag@mail.example.co")).toBeUndefined();
  });

  it("rejects blanks and obvious typos", () => {
    expect(email("")).toMatch(/enter your/i);
    expect(email("not-an-email")).toMatch(/valid email/i);
    expect(email("a@b")).toMatch(/valid email/i);
    expect(email("a b@c.com")).toMatch(/valid email/i);
  });
});

describe("password", () => {
  it("mirrors the backend rules", () => {
    expect(password("")).toMatch(/choose/i);
    expect(password("short")).toMatch(/8 characters/);
    expect(password("12345678")).toMatch(/only numbers/i);
    expect(password("SafePass123")).toBeUndefined();
  });

  it("confirmation must match exactly", () => {
    expect(passwordConfirmation("", "x")).toMatch(/re-enter/i);
    expect(passwordConfirmation("abc", "abd")).toMatch(/match/i);
    expect(passwordConfirmation("same", "same")).toBeUndefined();
  });
});

describe("name", () => {
  it("rejects digits and markup, accepts accents and spaces", () => {
    expect(name("Ama Mensah", "first name")).toBeUndefined();
    expect(name("Renée", "first name")).toBeUndefined();
    expect(name("Ama2", "first name")).toMatch(/valid/i);
    expect(name("<script>", "first name")).toMatch(/valid/i);
    expect(name("", "first name")).toMatch(/enter your/i);
  });
});

describe("phone (optional)", () => {
  it("passes when blank, validates when typed", () => {
    expect(phone("")).toBeUndefined();
    expect(phone("+231 770 123 456")).toBeUndefined();
    expect(phone("abc")).toMatch(/phone number/i);
  });
});

describe("url", () => {
  it("requires an absolute http(s) URL", () => {
    expect(url("https://example.com/apply")).toBeUndefined();
    expect(url("example.com")).toMatch(/https:\/\//);
    expect(url("")).toMatch(/required/i);
  });
});

describe("helpers", () => {
  it("required/minLength/maxLength/choice behave as rules", () => {
    expect(required(" ", "email")).toMatch(/enter your/i);
    expect(required("x", "email")).toBeUndefined();
    expect(minLength("ab", 3, "too short")).toBe("too short");
    expect(minLength("abc", 3, "too short")).toBeUndefined();
    expect(maxLength("abcd", 3, "too long")).toBe("too long");
    expect(choice("b", ["a", "b"], "bad")).toBeUndefined();
    expect(choice("z", ["a", "b"], "bad")).toBe("bad");
  });

  it("collect drops passing rules and keeps failures", () => {
    expect(collect({ a: undefined, b: "broken" })).toEqual({ b: "broken" });
  });

  it("flattenFieldErrors lifts DRF's nested user errors to the top level", () => {
    expect(
      flattenFieldErrors({ user: { email: "taken" }, phone: "bad" }),
    ).toEqual({ email: "taken", phone: "bad" });
    expect(flattenFieldErrors(null)).toEqual({});
    expect(flattenFieldErrors({ phone: "bad" })).toEqual({ phone: "bad" });
  });
});
