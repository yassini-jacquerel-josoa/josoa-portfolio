import { describe, it, expect } from "vitest";
import { renderSeoTags } from "../seo.ts";
import profileJson from "../../src/data/profile.data.json" with { type: "json" };
import type { Profile } from "../../src/data/profile.schema.ts";

describe("scripts/seo", () => {
  const profile = profileJson as unknown as Profile;

  it("génère les balises de base (titre, meta description, og tags)", () => {
    const html = renderSeoTags(profile);

    expect(html).toContain("<title>");
    expect(html).toContain(profile.identity.fullName);
    expect(html).toContain('<meta name="description"');
    expect(html).toContain('<meta property="og:title"');
    expect(html).toContain('<meta property="og:type" content="profile" />');
    expect(html).toContain('<link rel="canonical"');
  });

  it("génère un JSON-LD Person valide", () => {
    const html = renderSeoTags(profile);
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);

    expect(jsonLdMatch).not.toBeNull();
    const parsed = JSON.parse(jsonLdMatch![1]);

    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("Person");
    expect(parsed.name).toBe(profile.identity.fullName);
    expect(parsed.email).toBe(profile.identity.email);
    expect(Array.isArray(parsed.sameAs)).toBe(true);
  });
});
