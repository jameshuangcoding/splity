import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  // Default to node for API route tests; override per-file with @jest-environment jsdom
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "app/api/**/*.ts",
    "stores/**/*.ts",
    "!lib/prisma.ts",
    "!lib/api.ts",
    "!lib/supabase/**",
    "!**/*.d.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ["text", "lcov"],
};

export default createJestConfig(config);
