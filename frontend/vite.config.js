import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  proxy: {
    "/api": {
      target: "https://kitchenkit.onrender.com",
    },
  },
  plugins: [react()],
});
