import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Static Vite SPA. GitHub Pages hosts this under the repository subpath.
export default defineConfig({
  base: "/wafferli-v13/",
  plugins: [react(), tailwindcss(), tsconfigPaths()],
  build: { outDir: "../react-dist", emptyOutDir: true },
});
