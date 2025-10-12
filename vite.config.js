import { defineConfig } from "vite";

export default defineConfig({
  base: "/3dtictactoe/",
  root: "src",
  publicDir: "../public",
  server: {
    port: 3001,
    open: true,
  },
  build: {
    outDir: "../docs",
    assetsDir: "assets",
    emptyOutDir: true,
  },
});
