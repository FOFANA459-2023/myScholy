import "@testing-library/jest-dom/vitest";

// jsdom implements neither IntersectionObserver nor scrollIntoView, both of
// which the marketing components use for ambient behaviour (carousel pausing,
// hash scrolling). Stub them so components mount; the behaviours themselves
// are covered by the Playwright suite in a real browser.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = IntersectionObserverStub;
}

if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
