import { useEffect, type RefObject } from "react";
import { animate, onScroll, stagger } from "animejs";

const ENTER = "right left";
const CROSS = "left right";
const REVEAL = "center center";
const ARRIVE = "68% start";
/** Même seuil que la mise en page tablette/téléphone dans App.css */
const DESKTOP_MOTION = "(min-width: 1041px)";

/**
 * Parallax et entrées du mode ordinateur, liées au scroll horizontal.
 * Les observateurs sont montés après la chorégraphie du Hero.
 */
export function useScrollMotion(rootRef: RefObject<HTMLDivElement | null>, ready: boolean) {
  useEffect(() => {
    const container = rootRef.current;
    if (!ready || !container) return;

    const desktop = window.matchMedia(DESKTOP_MOTION);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stop = () => {};

    const mount = () => {
      stop();
      if (reduced.matches) return;
      stop = attachScrollMotion(container, desktop.matches);
    };

    mount();
    desktop.addEventListener("change", mount);
    reduced.addEventListener("change", mount);
    return () => {
      desktop.removeEventListener("change", mount);
      reduced.removeEventListener("change", mount);
      stop();
    };
  }, [ready, rootRef]);
}

function attachScrollMotion(container: HTMLDivElement, desktop: boolean) {

    const animations: Array<ReturnType<typeof animate>> = [];

    const bind = (
      targets: HTMLElement | HTMLElement[],
      parameters: Parameters<typeof animate>[1],
      range: { target: HTMLElement; enter?: string; leave?: string; sync?: boolean | "inOutSine" },
    ) => {
      const list = Array.isArray(targets) ? targets : [targets];
      if (list.length === 0) return;
      const observer = onScroll({
        container,
        axis: "x",
        sync: range.sync ?? true,
        enter: range.enter ?? ENTER,
        leave: range.leave ?? CROSS,
        target: range.target,
      });
      animations.push(animate(list, { ease: "inOutSine", ...parameters, autoplay: observer }));
    };

    const collage = container.querySelector<HTMLElement>(".collage");
    const base = container.querySelector<HTMLElement>(".collage__base img");
    const overlay = container.querySelector<HTMLElement>(".collage__overlay img");
    // Le portrait debute cache ~20% (translate X -20%) puis se deplace au scroll (parallax).
    if (collage) {
      const portraitReveal = { target: collage, enter: "left left", leave: "left 32%", sync: true as const };
      if (base) {
        const framing = desktop ? getComputedStyle(base) : null;
        const peekX = framing?.getPropertyValue("--portrait-peek-x").trim();
        const peekScale = Number(framing?.getPropertyValue("--portrait-peek-scale")) || 1.65;
        bind(
          base,
          desktop
            ? { x: [peekX || "-8vw", "0vw"], scale: [peekScale, 1], ease: "inOutCubic" }
            : { x: ["-20%", "0%"], ease: "outCubic" },
          portraitReveal,
        );
      }
      if (overlay) {
        bind(
          overlay,
          { opacity: [0, 1], x: ["10%", "0%"], ease: "inOutSine" },
          portraitReveal,
        );
      }
    }

    if (desktop) container.querySelectorAll<HTMLElement>(".origin__box").forEach((box, index) => {
      const back = box.querySelector<HTMLElement>(".origin__img--back");
      const front = box.querySelector<HTMLElement>(".origin__img--front");
      if (back) {
        bind(
          back,
          {
            x: index === 0 ? ["-8%", "9%"] : ["8%", "-10%"],
            y: index === 0 ? ["4%", "-5%"] : ["-4%", "6%"],
            scale: [1.14, 1.04],
            ease: "linear",
          },
          { target: box, sync: "inOutSine" },
        );
      }
      if (front) {
        bind(
          front,
          { x: ["0%", "108%"], ease: "inOutSine" },
          { target: box, enter: ENTER, leave: REVEAL },
        );
      }
    });

    if (desktop) {
      const about = container.querySelector<HTMLElement>(".about");
      const aboutLines = [...container.querySelectorAll<HTMLElement>(".about__line")];
      if (about && aboutLines.length > 0) {
        bind(
          aboutLines,
          {
            y: [32, 0],
            opacity: [0, 1],
            delay: stagger(120),
            duration: 900,
            ease: "outCubic",
          },
          { target: about, enter: ENTER, leave: "68% start" },
        );
      }

      container.querySelectorAll<HTMLElement>(".project-card").forEach((card) => {
        const image = card.querySelector<HTMLElement>(".project-card__media img");
        // Les visuels « contain » (PNG transparents) restent centrés, sans parallaxe.
        if (!image || image.classList.contains("project-card__img--contain")) return;
        bind(
          image,
          { x: ["12%", "-10%"], scale: [1.2, 1.03], ease: "linear" },
          { target: card, sync: "inOutSine" },
        );
      });

      const principles = container.querySelector<HTMLElement>(".principles");
      if (principles) {
        const shifts: Array<[string, string]> = [
          ["5vw", "-7vw"],
          ["-4vw", "8vw"],
          ["6vw", "-4vw"],
        ];
        container.querySelectorAll<HTMLElement>(".principles__row").forEach((row, index) => {
          bind(
            row,
            { x: shifts[index] ?? ["2vw", "-2vw"], ease: "linear" },
            { target: principles, sync: "inOutSine" },
          );
        });
      }

      container.querySelectorAll<HTMLElement>("[data-motion='enter']").forEach((node) => {
        bind(
          node,
          { y: [28, 0], opacity: [0, 1], duration: 900, ease: "outCubic" },
          { target: node, enter: ENTER, leave: ARRIVE },
        );
      });
    }

    return () => {
      for (const animation of animations) animation.revert();
    };
}
