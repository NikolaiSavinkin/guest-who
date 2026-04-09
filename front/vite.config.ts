import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths"

// https://vite.dev/config/
// Prefer .ts before .js: Vite defaults pick .js first, so a stray shared/src/schema.js shadows
// schema.ts and Rollup fails on CJS named exports (e.g. error_schema).
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    extensions: [
      ".ts",
      ".tsx",
      ".mts",
      ".cts",
      ".jsx",
      ".mjs",
      ".js",
      ".json",
    ],
  },
})
