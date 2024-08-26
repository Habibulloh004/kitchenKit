import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  proxy: {
    "/api": {
      target: "http://localhost:9000",
    },
  },
  plugins: [react()],
});
