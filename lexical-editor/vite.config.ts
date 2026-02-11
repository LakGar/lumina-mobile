import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: "dist",
    assetsInlineLimit: 100000000,
    rollupOptions: {
      output: {
        format: "iife",
        name: "LexicalEditor",
        inlineDynamicImports: true,
      },
    },
  },
});
