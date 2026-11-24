import { useEffect, type RefObject } from "react";
import { animate, onScroll } from "animejs";

const ENTER = "right left";
const CROSS = "left right";
const ARRIVE = "68% start";
/** Même seuil que la mise en page tablette/téléphone dans App.css */
const DESKTOP_MOTION = "(min-width: 1041px)";

/**
 * Parallax et entrées du mode ordinateur, liées au scroll horizontal.
 */
export function useScrollMotion(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;

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
  }, [rootRef]);
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

    const values = container.querySelector<HTMLElement>(".values");
    const rail = values?.querySelector<HTMLElement>(".values__rail-track");
    if (values && rail) {
      const accelerate = (progress: number) => progress * (0.65 + 0.35 * progress);
      bind(rail, { y: ["0%", "-100%"], ease: accelerate }, { target: values });
      const stars = [...rail.querySelectorAll<HTMLElement>(".values__star")];
      bind(stars, { rotate: [0, 720], ease: accelerate }, { target: values });
    }

    if (desktop) {
      const principles = container.querySelector<HTMLElement>(".principles");
      if (principles) {
        const shifts: Array<[string, string]> = [
          ["1rem", "-1rem"],
          ["-1rem", "1rem"],
          ["1rem", "-0.5rem"],
        ];
        container.querySelectorAll<HTMLElement>(".principles__row").forEach((row, index) => {
          bind(
            row,
            { x: shifts[index] ?? ["0rem", "0rem"], ease: "linear" },
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
