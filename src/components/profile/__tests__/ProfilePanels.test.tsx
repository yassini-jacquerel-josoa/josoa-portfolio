import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  HeroPanel,
  AboutPanel,
  ExperiencePanel,
  ProjectsPanel,
  EducationPanel,
} from "../ProfilePanels.tsx";
import { profile } from "../../../data/profile.ts";

vi.mock("../../FontMorph.tsx", () => ({
  default: () => <div data-testid="font-morph-mock" />,
}));

describe("<ProfilePanels />", () => {
  describe("<HeroPanel />", () => {
    it("affiche le nom complet et la localisation", () => {
      render(<HeroPanel shrunk={false} />);
      expect(screen.getAllByText(profile.identity.fullName, { exact: false }).length).toBeGreaterThan(0);
      expect(screen.getAllByText(profile.identity.location, { exact: false }).length).toBeGreaterThan(0);
    });
  });

  describe("<AboutPanel />", () => {
    it("affiche la section À propos", () => {
      render(<AboutPanel />);
      expect(screen.getByRole("region", { name: /à propos/i })).toBeInTheDocument();
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

      const links = screen.getAllByRole("link");
      links.forEach((link) => {
        if (link.getAttribute("target") === "_blank") {
          expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
        }
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
});
