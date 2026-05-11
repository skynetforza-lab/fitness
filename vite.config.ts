import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api/food-search": {
        target: "https://world.openfoodfacts.org",
        changeOrigin: true,
        rewrite: (p) => {
          const qs = p.includes("?") ? p.split("?")[1] : "";
          const params = new URLSearchParams(qs);
          const q = params.get("query") ?? "";
          return (
            `/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
            `&json=1&fields=product_name,nutriments&page_size=20`
          );
        },
      },
      "/api/food-barcode": {
        target: "https://world.openfoodfacts.org",
        changeOrigin: true,
        rewrite: (p) => {
          const qs = p.includes("?") ? p.split("?")[1] : "";
          const params = new URLSearchParams(qs);
          const code = params.get("barcode") ?? "";
          return `/api/v0/product/${encodeURIComponent(code)}.json`;
        },
      },
    },
  },
});
