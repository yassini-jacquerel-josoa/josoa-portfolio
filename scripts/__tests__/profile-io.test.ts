import { describe, it, expect } from "vitest";
import { parseProfile, readProfileSource, readProfile, profileJsonPath } from "../profile-io.ts";
import profileData from "../../src/data/profile.data.json" with { type: "json" };
import { existsSync } from "node:fs";

describe("scripts/profile-io", () => {
  it("définit un chemin vers profile.data.json existant", () => {
    expect(profileJsonPath).toContain("profile.data.json");
    expect(existsSync(profileJsonPath)).toBe(true);
  });

  it("parseProfile valide et retourne un objet Profile valide", () => {
    const profile = parseProfile(profileData);
    expect(profile.identity.fullName).toBe(profileData.identity.fullName);
    expect(profile.projects.length).toBeGreaterThan(0);
  });

  it("parseProfile lève une erreur explicite si les données sont invalides", () => {
    expect(() => parseProfile({ invalid: true })).toThrow(/profile\.data\.json invalide/);
  });

  it("readProfileSource charge le texte brut et les données parsées", () => {
    const { text, data } = readProfileSource();
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(data).toHaveProperty("identity");
  });

  it("readProfile lit et valide le profil complet du projet", () => {
    const profile = readProfile();
    expect(profile.identity.email).toContain("@");
    expect(profile.headline.length).toBeGreaterThan(0);
  });
});
