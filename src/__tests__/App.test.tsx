import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import App from "../App.tsx";
import { createDesktopScroll } from "../animations/desktopScroll.ts";

vi.mock("../animations/desktopScroll.ts", () => ({
  createDesktopScroll: vi.fn(),
}));

vi.mock("../animations/useScrollMotion.ts", () => ({
  useScrollMotion: vi.fn(),
}));

vi.mock("../components/FontMorph.tsx", () => ({
  default: () => <div data-testid="font-morph-mock" />,
}));

describe("<App />", () => {
  let desktop = false;

  beforeEach(() => {
    desktop = false;
    vi.mocked(createDesktopScroll).mockReset();
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: desktop && query === "(min-width: 1041px)",
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

  it("délègue la molette au pilote sur ordinateur et lui transmet les ancres du menu", () => {
    desktop = true;
    const resize = vi.fn();
    const jumpTo = vi.fn();
    const destroy = vi.fn();
    vi.mocked(createDesktopScroll).mockReturnValue({ resize, jumpTo, destroy });
    const initialUrl = window.location.href;
    const { unmount } = render(<App />);

    try {
      const scroller = screen.getByLabelText("Parcours horizontal");
      const wheel = new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true });
      scroller.dispatchEvent(wheel);
      expect(createDesktopScroll).toHaveBeenCalledOnce();
      expect(vi.mocked(createDesktopScroll).mock.calls[0][3]).toBe(0.64);
      expect(wheel.defaultPrevented).toBe(false);
      jumpTo.mockClear();

      fireEvent.click(screen.getByRole("link", { name: "Projets" }));
      expect(jumpTo).toHaveBeenCalledOnce();
      expect(window.location.hash).toBe("#projets");
      expect(screen.getByRole("region", { name: "Projets" })).toHaveFocus();
    } finally {
      unmount();
      window.history.replaceState(null, "", initialUrl);
    }
    expect(destroy).toHaveBeenCalledOnce();
  });

  it("convertit directement la molette verticale en déplacement horizontal sur mobile", () => {
    vi.spyOn(Element.prototype, "scrollWidth", "get").mockReturnValue(4000);
    vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(1200);
    const { unmount } = render(<App />);
    try {
      const scroller = screen.getByLabelText("Parcours horizontal");
      const wheel = new WheelEvent("wheel", { deltaY: 120, cancelable: true });
      scroller.dispatchEvent(wheel);
      expect(createDesktopScroll).not.toHaveBeenCalled();
      expect(wheel.defaultPrevented).toBe(true);
      expect(scroller.scrollLeft).toBe(76.8);
    } finally {
      unmount();
      vi.restoreAllMocks();
    }
  });
});
