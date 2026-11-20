import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App.tsx";

vi.mock("../animations/useScrollMotion.ts", () => ({
  useScrollMotion: vi.fn(),
}));

vi.mock("../components/FontMorph.tsx", () => ({
  default: () => <div data-testid="font-morph-mock" />,
}));

describe("<App />", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("s'initialise et monte les sections principales de la page", () => {
    render(<App />);

    expect(screen.getByRole("region", { name: /accueil/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /à propos/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /projets/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /formation/i })).toBeInTheDocument();
  });
});
