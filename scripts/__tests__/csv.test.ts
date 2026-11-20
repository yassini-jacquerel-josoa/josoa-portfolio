import { describe, it, expect } from "vitest";
import { parseCsv, pick } from "../csv.ts";

describe("scripts/csv", () => {
  describe("parseCsv", () => {
    it("parse les lignes simples avec virgule", () => {
      const csv = "Nom,Entreprise,Poste\nDupont,Acme,Dev\nMartin,Beta,Lead";
      const result = parseCsv(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ Nom: "Dupont", Entreprise: "Acme", Poste: "Dev" });
      expect(result[1]).toEqual({ Nom: "Martin", Entreprise: "Beta", Poste: "Lead" });
    });

    it("supprime le BOM UTF-8", () => {
      const csv = "\uFEFFHeaderA,HeaderB\nValA,ValB";
      const result = parseCsv(csv);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ HeaderA: "ValA", HeaderB: "ValB" });
    });

    it("gère les champs entre guillemets avec virgules et sauts de ligne", () => {
      const csv = 'Titre,"Description détaillée"\nProjet,"Ligne 1,\net ligne 2"';
      const result = parseCsv(csv);

      expect(result).toHaveLength(1);
      expect(result[0]["Titre"]).toBe("Projet");
      expect(result[0]["Description détaillée"]).toBe("Ligne 1,\net ligne 2");
    });

    it("gère les guillemets doubles échappés", () => {
      const csv = 'Cle,Texte\n1,"Il a dit ""Bonjour"""';
      const result = parseCsv(csv);

      expect(result).toHaveLength(1);
      expect(result[0]["Texte"]).toBe('Il a dit "Bonjour"');
    });

    it("ignore les lignes vides", () => {
      const csv = "A,B\n\n1,2\n   \n3,4\n";
      const result = parseCsv(csv);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ A: "1", B: "2" });
      expect(result[1]).toEqual({ A: "3", B: "4" });
    });

    it("retourne un tableau vide si aucun contenu ou seulement en-tête vide", () => {
      expect(parseCsv("")).toEqual([]);
      expect(parseCsv("   \n\n  ")).toEqual([]);
    });
  });

  describe("pick", () => {
    it("récupère la première valeur trouvée sans tenir compte de la casse", () => {
      const row = { "Company Name": "OpenAI", Location: "Paris" };
      expect(pick(row, ["company name", "entreprise"])).toBe("OpenAI");
      expect(pick(row, ["LOCATION", "ville"])).toBe("Paris");
    });

    it("retourne une chaîne vide si aucune correspondance", () => {
      const row = { "Company Name": "OpenAI" };
      expect(pick(row, ["role", "poste"])).toBe("");
    });
  });
});
