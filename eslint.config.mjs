import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// UI / business-logic separation boundary (enforced per unit constraint):
// - Pure layers (src/shared and any src/../core) MUST NOT import React/Next or
//   reach into UI (components) / adapter (state, context) layers.
// - Presentational components MUST NOT import core directly — they consume it
//   via hooks in the state layer.
const coreNoUiImports = {
  files: ["src/shared/**/*.{ts,tsx}", "src/**/core/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          { name: "react", message: "core/shared is framework-agnostic — no React." },
          { name: "react-dom", message: "core/shared is framework-agnostic — no react-dom." },
          { name: "framer-motion", message: "core/shared must not depend on animation libs." },
        ],
        patterns: [
          { group: ["next", "next/*"], message: "core/shared must not import Next.js." },
          { group: ["**/components/**", "*/components/*"], message: "core must not import UI components." },
          { group: ["**/state/**", "**/context/**", "*/state/*", "*/context/*"], message: "core must not import the state/adapter layer." },
        ],
      },
    ],
  },
};

const componentsNoCoreImports = {
  files: ["src/**/components/**/*.{ts,tsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          { group: ["**/core/**", "*/core/*"], message: "Presentational components must consume core via hooks, not import core directly." },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  coreNoUiImports,
  componentsNoCoreImports,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
