import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
<<<<<<< HEAD
  plugins: [react(), tailwindcss(), viteSingleFile()],
=======
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(),
    {
      name: "rename-app-html-to-index",
      generateBundle: {
        order: "post",
        handler(_options, bundle) {
          const appHtml = bundle["app.html"];
          if (!appHtml || appHtml.type !== "asset") {
            throw new Error("The app.html build entry was not emitted.");
          }
          delete bundle["app.html"];
          bundle["index.html"] = { ...appHtml, fileName: "index.html" };
        },
      },
    },
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "app.html"),
      },
    },
  },
>>>>>>> b96a6a9 (update commit)
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
