import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

function runNode(script: string): string {
  return execFileSync(process.execPath, [path.join(root, script)], {
    cwd: root,
    encoding: "utf8",
  });
}

function profileSeoPlugin(): Plugin {
  return {
    name: "profile-seo",
    buildStart() {
      execFileSync(process.execPath, [path.join(root, "scripts/validate-profile.ts")], {
        cwd: root,
        stdio: "inherit",
      });
    },
    transformIndexHtml(html) {
      const block = runNode("scripts/render-seo.ts").replace(/\s+$/, "");
      const wrapped = `<!-- PROFILE_SEO_START -->\n${block}\n    <!-- PROFILE_SEO_END -->`;
      if (html.includes("PROFILE_SEO_START") && html.includes("PROFILE_SEO_END")) {
        return html.replace(
          /<!-- PROFILE_SEO_START -->[\s\S]*?<!-- PROFILE_SEO_END -->/,
          wrapped,
        );
      }
      if (html.includes("<title>") && html.includes("application/ld+json")) {
        return html.replace(/[ \t]*<title>[\s\S]*?<\/script>/, block);
      }
      if (html.includes("</head>")) {
        return html.replace("</head>", `${wrapped}\n  </head>`);
      }
      throw new Error("Impossible d'injecter le SEO dans index.html");
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [profileSeoPlugin(), react()],
  optimizeDeps: {
    include: ["opentype.js", "flubber"],
  },
});
