import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const asConfigArray = (config) => {
  const normalized = config?.default ?? config;
  return Array.isArray(normalized) ? normalized : [normalized];
};

export default [
  ...asConfigArray(nextVitals),
  ...asConfigArray(nextTs),
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "scripts/**/*.cjs",
    ],
  },
];
