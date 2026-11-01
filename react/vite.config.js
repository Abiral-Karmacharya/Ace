import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, "");

  return {
    plugins: [react()],
    server: {
      port: Number(env.PORT),
      host: true,
      allowedHosts: [env.ALLOWED_HOST],
      proxy: {
        "/api": {
          target: env.VITE_API_LINK,
          changeOrigin: true,
        },
      },
    },
  };
});
