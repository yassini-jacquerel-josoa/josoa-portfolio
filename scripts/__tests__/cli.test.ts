import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import path from "node:path";

describe("scripts CLI", () => {
  const root = path.resolve(".");

  it("validate-profile.ts valide les données actuelles sans erreur", () => {
    const output = execFileSync(process.execPath, ["scripts/validate-profile.ts"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(output).toContain("profile.data.json valide");
  });

  it("render-seo.ts génère les balises SEO et le JSON-LD", () => {
    const output = execFileSync(process.execPath, ["scripts/render-seo.ts"], {
      cwd: root,
      encoding: "utf8",
    });
    expect(output).toContain("<title>");
    expect(output).toContain("application/ld+json");
  });
});
