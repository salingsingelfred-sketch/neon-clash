import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const renameAppHtmlEntry = {
  name: "rename-app-html-entry",
  enforce: "post" as const,
  generateBundle(_options: unknown, bundle: Record<string, { type: string; fileName: string }>) {
    const appHtml = bundle["app.html"];
    if (!appHtml || appHtml.type !== "asset") {
      throw new Error("Expected app.html to be present in the build output.");
    }

    delete bundle["app.html"];
    appHtml.fileName = "index.html";
    bundle["index.html"] = appHtml;
  },
};

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile(), renameAppHtmlEntry],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "app.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
