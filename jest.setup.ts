import "@testing-library/jest-dom";

// Polyfill performance.now() for jsdom environments that lack it
if (typeof globalThis.performance === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  globalThis.performance = require("perf_hooks").performance;
}
