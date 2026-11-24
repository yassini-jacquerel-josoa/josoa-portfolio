import { describe, it, expect } from "vitest";
import {
  cityOf,
  firstSentence,
  formatDate,
  formatEducationPeriod,
  formatExperiencePeriod,
  headlineBits,
  lastSentence,
  orderedProjects,
  phoneHref,
  projectStatusLabel,
  sentences,
  whatsappHref,
} from "../profile.ts";

describe("src/data/profile helpers", () => {
  describe("sentences / firstSentence / lastSentence", () => {
    it("découpe correctement les phrases selon les points", () => {
      const text = "Première phrase. Deuxième phrase. Troisième phrase.";
      const res = sentences(text);
      expect(res).toEqual(["Première phrase.", "Deuxième phrase.", "Troisième phrase."]);
      expect(firstSentence(text)).toBe("Première phrase.");
      expect(lastSentence(text)).toBe("Troisième phrase.");
    });

    it("gère un texte à phrase unique sans point final", () => {
      const text = "Phrase unique";
      expect(firstSentence(text)).toBe("Phrase unique");
      expect(lastSentence(text)).toBe("Phrase unique");
    });
  });

  describe("headlineBits", () => {
    it("extrait le rôle, la stack et le focus", () => {
      const headline = "Développeur Fullstack | React · Node.js | Solutions Cloud";
      const bits = headlineBits(headline);

      expect(bits.lineA).toBe("Développeur");
      expect(bits.lineB).toBe("Fullstack");
      expect(bits.stack).toBe("React · Node.js");
      expect(bits.accent).toBe("Cloud");
      expect(bits.prefix).toBe("Solutions");
      expect(bits.aboutLines).toContain("React");
    });
  });

  describe("formatDate and periods", () => {
    it("formate l'année-mois en nom de mois en français", () => {
      expect(formatDate("2024-01")).toBe("janvier 2024");
      expect(formatDate("2024-12")).toBe("décembre 2024");
      expect(formatDate("2024")).toBe("2024");
    });

    it("formate la période d'expérience en cours", () => {
      const currentExp = { start: "2023-09", end: null, current: true };
      const formatted = formatExperiencePeriod(currentExp);
      expect(formatted).toBe("depuis septembre 2023 · poste actuel");
    });

    it("formate la période terminée", () => {
      const pastExp = { start: "2022-01", end: "2023-06", current: false };
      const formatted = formatExperiencePeriod(pastExp);
      expect(formatted).toBe("janvier 2022 – juin 2023");
    });

    it("formate la période d'étude en cours", () => {
      const currentEdu = { start: "2023-09", end: null, current: true };
      const formatted = formatEducationPeriod(currentEdu);
      expect(formatted).toContain("en cours");
    });
  });

  describe("phoneHref and whatsappHref", () => {
    it("génère des liens tel et whatsapp nettoyés", () => {
      const phone = "+261 34 12 345 67";
      expect(phoneHref(phone)).toBe("tel:+261341234567");
      expect(whatsappHref(phone)).toBe("https://wa.me/261341234567");
    });
  });

  describe("cityOf", () => {
    it("extrait la ville depuis une chaîne de localisation", () => {
      expect(cityOf("Antananarivo, Madagascar")).toBe("Antananarivo");
      expect(cityOf("Paris")).toBe("Paris");
    });
  });

  describe("orderedProjects", () => {
    it("trie les projets 'en_cours' avant 'termine' en conservant l'ordre initial", () => {
      const projects = [
        { name: "P1", status: "termine" as const },
        { name: "P2", status: "en_cours" as const },
        { name: "P3", status: "termine" as const },
        { name: "P4", status: "en_cours" as const },
      ];
      const ordered = orderedProjects(projects);
      expect(ordered.map((p) => p.name)).toEqual(["P2", "P4", "P1", "P3"]);
    });

    it("trie les projets selon leur ordre explicite", () => {
      const projects = [
        { name: "P1", status: "termine" as const, order: 3 },
        { name: "P2", status: "en_cours" as const, order: 1 },
        { name: "P3", status: "termine" as const, order: 2 },
      ];
      const ordered = orderedProjects(projects);
      expect(ordered.map((p) => p.name)).toEqual(["P2", "P3", "P1"]);
    });
  });

  describe("projectStatusLabel", () => {
    it("retourne le libellé i18n approprié", () => {
      expect(projectStatusLabel("en_cours")).toBe("En cours");
      expect(projectStatusLabel("termine")).toBe("Terminé");
    });
  });
});
