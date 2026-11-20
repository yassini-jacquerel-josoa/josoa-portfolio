import { describe, it, expect } from "vitest";
import { profileSchema, formatProfileIssues } from "../profile.schema.ts";
import profileData from "../profile.data.json" with { type: "json" };

describe("src/data/profile.schema", () => {
  it("valide les données de profile.data.json sans erreurs", () => {
    const parsed = profileSchema.safeParse(profileData);
    if (!parsed.success) {
      console.error(formatProfileIssues(parsed.error));
    }
    expect(parsed.success).toBe(true);
  });

  it("rejette les formats de date invalides (ex: non ISO année-mois)", () => {
    const invalidData = {
      ...profileData,
      experience: [
        {
          ...profileData.experience[0],
          start: "2024/05/12", // Invalide : attendu AAAA ou AAAA-MM
        },
      ],
    };

    const parsed = profileSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issues = formatProfileIssues(parsed.error);
      expect(issues).toContain("date AAAA ou AAAA-MM");
    }
  });

  it("rejette les emails invalides", () => {
    const invalidData = {
      ...profileData,
      identity: {
        ...profileData.identity,
        email: "adresse-invalide",
      },
    };

    const parsed = profileSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatProfileIssues(parsed.error)).toContain("email invalide");
    }
  });

  it("interdit les clés non déclarées (strictObject)", () => {
    const withExtraKey = {
      ...profileData,
      birthDate: "1995-01-01",
    };

    const parsed = profileSchema.safeParse(withExtraKey);
    expect(parsed.success).toBe(false);
  });
});
