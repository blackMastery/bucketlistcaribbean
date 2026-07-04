import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests run in Node (pure domain logic in lib/*). Component/integration
// tests are out of scope for this harness; keep the suite fast and isolated.
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
