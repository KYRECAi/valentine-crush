import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { resolve, relative, dirname } from "node:path";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const root = process.cwd();
const release = JSON.parse(readFileSync(resolve(root, "scripts/game-release.json"), "utf8"));
const base = process.env.GUARDIAN_GAME_BASE_PATH || "/";
if (!/^\/(?:[a-z0-9-]+\/)*$/.test(base)) throw new Error("Game base must be a local directory path");

export default defineConfig({
  base, publicDir: false,
  resolve: { alias: { "@": resolve(root, "src") } },
  plugins: [
    {
      name: "kyrec-game-asset-base",
      enforce: "pre",
      transform(code, id) {
        const local = relative(root, id).replaceAll("\\", "/");
        if (!local.startsWith("src/game/") && local !== "src/components/bonus-view.tsx") return null;
        return code.replace(/(["'`])\/(art|sprites|voice|map|cover)\//g, (_, quote, dir) => quote + base + dir + "/");
      },
      generateBundle(_options, bundle) {
        const html = bundle["game.html"];
        if (html) { delete bundle["game.html"]; html.fileName = "index.html"; bundle["index.html"] = html; }
      },
      writeBundle(options) {
        const out = resolve(options.dir);
        if (existsSync(resolve(out, "game.html"))) copyFileSync(resolve(out, "game.html"), resolve(out, "index.html"));
        const assets = release.assets.map(path => {
          const source = resolve(root, "public", path);
          if (!source.startsWith(resolve(root, "public") + "/") || !existsSync(source)) throw new Error("Missing approved game asset: " + path);
          const dest = resolve(out, path);
          mkdirSync(dirname(dest), { recursive: true });
          copyFileSync(source, dest);
          return { path, sha256: createHash("sha256").update(readFileSync(source)).digest("hex") };
        });
        writeFileSync(resolve(out, "release.json"), JSON.stringify({
          game: release.game, source: process.env.GUARDIAN_GAME_SOURCE_REF || release.source, baseSource: release.source, arcadeProtocol: 1,
          mode: "arcade", familyPointsAuthority: false, assets,
        }, null, 2) + "\n");
      },
    },
    react(), tailwind(),
  ],
  build: { outDir: "dist-guardian", emptyOutDir: true, rollupOptions: { input: resolve(root, "game.html") } },
});
