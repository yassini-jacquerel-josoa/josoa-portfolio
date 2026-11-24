import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import {
  HeroPanel,
  AboutPanel,
  PullQuotePanel,
  ExperiencePanel,
  ProjectsPanel,
  EducationPanel,
  SkillsHighlightPanel,
  SkillsPanel,
  ContactPanel,
} from "../ProfilePanels.tsx";
import { profile } from "../../../data/profile.ts";

vi.mock("../../FontMorph.tsx", () => ({
  default: () => <div data-testid="font-morph-mock" />,
}));

describe("<ProfilePanels />", () => {
  describe("<HeroPanel />", () => {
    it("affiche le nom complet et la localisation", () => {
      render(<HeroPanel />);
      expect(screen.getAllByText(profile.identity.fullName, { exact: false }).length).toBeGreaterThan(0);
      expect(screen.getAllByText(profile.identity.location, { exact: false }).length).toBeGreaterThan(0);
    });
  });

  describe("<AboutPanel />", () => {
    it("affiche la section À propos", () => {
      render(<AboutPanel />);
      expect(screen.getByRole("region", { name: /à propos/i })).toBeInTheDocument();
      expect(screen.getByText("Senior")).toHaveAttribute("data-about-pin");
      expect(screen.getByText("IA & SaaS")).toHaveAttribute("data-about-pin");
      expect(screen.getByText("Fullstack")).not.toHaveAttribute("data-about-pin");
    });
  });

  describe("<PullQuotePanel />", () => {
    it("affiche le bandeau de citation / valeurs", () => {
      render(<PullQuotePanel />);
      expect(screen.getByRole("region", { name: /profil/i })).toBeInTheDocument();
    });
  });

  describe("<ExperiencePanel />", () => {
    it("affiche toutes les expériences avec les postes et entreprises", () => {
      render(<ExperiencePanel />);

      profile.experience.forEach((job) => {
        expect(screen.getByRole("heading", { name: job.title })).toBeInTheDocument();
        expect(screen.getByText(job.organization)).toBeInTheDocument();
      });
    });
  });

  describe("<ProjectsPanel />", () => {
    it("affiche les titres des projets et des liens externes sécurisés", () => {
      render(<ProjectsPanel />);

      profile.projects.forEach((proj) => {
        expect(screen.getByRole("heading", { name: proj.name })).toBeInTheDocument();
      });

      const project = profile.projects.find((item) => item.links.length > 0);
      expect(project).toBeDefined();
      if (!project) return;
      fireEvent.click(screen.getByRole("button", { name: `Voir le projet ${project.name}` }));
      const dialog = screen.getByRole("dialog", { name: project.name });
      const links = within(dialog).getAllByRole("link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
      });
    });
  });

  describe("<EducationPanel />", () => {
    it("affiche les formations et écoles", () => {
      render(<EducationPanel />);

      profile.education.forEach((edu) => {
        expect(screen.getByRole("heading", { name: edu.degree })).toBeInTheDocument();
        expect(screen.getAllByText(edu.school).length).toBeGreaterThan(0);
      });
    });
  });

  describe("<SkillsHighlightPanel />", () => {
    it("affiche les étapes de développement dans l’ordre", () => {
      render(<SkillsHighlightPanel />);
      const steps = screen.getAllByRole("heading").map((heading) => heading.textContent);
      expect(steps).toEqual(["Architecture", "Implémentation", "Validation"]);
    });
  });

  describe("<SkillsPanel />", () => {
    it("affiche toutes les catégories de compétences et les langues", () => {
      render(<SkillsPanel />);

      profile.skills.forEach((group) => {
        expect(screen.getByRole("heading", { name: group.category })).toBeInTheDocument();
      });

      profile.languages.forEach((lang) => {
        expect(screen.getByText(lang.name, { exact: false })).toBeInTheDocument();
      });
    });
  });

  describe("<ContactPanel />", () => {
    it("affiche les options de contact, liens directs et bouton de CV", () => {
      render(<ContactPanel />);

      expect(screen.getByRole("link", { name: profile.identity.email })).toHaveAttribute(
        "href",
        `mailto:${profile.identity.email}`,
      );

      const phoneLink = screen.getByRole("link", { name: profile.identity.phone });
      expect(phoneLink).toHaveAttribute("href", expect.stringMatching(/^tel:/));

      const whatsappLink = screen.getByRole("link", { name: /whatsapp/i });
      expect(whatsappLink).toHaveAttribute("href", expect.stringMatching(/^https:\/\/wa\.me\//));

      const cvLink = screen.getByRole("link", { name: /cv/i });
      expect(cvLink).toHaveAttribute("download");

      profile.links.forEach((link) => {
        expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.url);
      });
    });
  });
});
