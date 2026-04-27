import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";

function asConfigArray(maybeArray) {
  return Array.isArray(maybeArray) ? maybeArray : [maybeArray];
}

const eslintConfig = defineConfig([
  ...asConfigArray(nextVitals),
  ...asConfigArray(nextTs),
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**/*.cjs",
  ]),
]);

export default eslintConfig;
