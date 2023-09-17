import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.{test,spec}.?(c|m)ts?(x)"],
    exclude: [...configDefaults.exclude, "packages/template/*"],
  },
});
