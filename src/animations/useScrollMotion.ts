import { useEffect, type RefObject } from "react";
import { animate, onScroll, stagger, type ScrollObserver } from "animejs";

const ENTER = "right left";
const CROSS = "left right";
const REVEAL = "center center";
const ARRIVE = "68% start";
/** Même seuil que la mise en page tablette/téléphone dans App.css */
const DESKTOP_MOTION = "(min-width: 1041px)";

/**
 * Parallax et entrées du mode ordinateur, liées au scroll horizontal.
 * Le hero se rétracte en 1,4 s : on recalcule les seuils pendant cette transition.
 */
export function useScrollMotion(rootRef: RefObject<HTMLDivElement | null>, ready: boolean) {
  useEffect(() => {
    const container = rootRef.current;
    if (!container || !ready) return;

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
    const observers: ScrollObserver[] = [];
    let alive = true;

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
      observers.push(observer);
      animations.push(animate(list, { ease: "inOutSine", ...parameters, autoplay: observer }));
    };

    const collage = container.querySelector<HTMLElement>(".collage");
    const base = container.querySelector<HTMLElement>(".collage__base img");
    const overlay = container.querySelector<HTMLElement>(".collage__overlay img");
    // Le portrait commence sur un cadrage serré (moitié du visage), puis le scroll découvre la photo entière.
    const portraitReveal = { target: collage, enter: "left left", leave: "left 32%", sync: true as const };
    if (collage && base) {
      bind(
        base,
        { scale: [1.65, 1], ease: "inOutCubic" },
        portraitReveal,
      );
    }
    if (collage && overlay) {
      bind(
        overlay,
        { opacity: [0, 1], x: ["10%", "0%"], ease: "inOutSine" },
        portraitReveal,
      );
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
        if (!image) return;
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

    const refresh = () => {
      if (!alive) return;
      observers[0]?.container.refresh();
    };

    let tracking = true;
    const track = () => {
      refresh();
      if (tracking && alive) requestAnimationFrame(track);
    };
    const stopTracking = () => {
      tracking = false;
      refresh();
    };

    const hero = container.querySelector<HTMLElement>(".hero");
    const onHeroEnd = (event: TransitionEvent) => {
      if (event.target !== hero) return;
      if (event.propertyName !== "flex-basis" && event.propertyName !== "width") return;
      stopTracking();
    };

    hero?.addEventListener("transitionend", onHeroEnd);
    window.addEventListener("resize", refresh);
    const timeout = window.setTimeout(stopTracking, 1800);
    requestAnimationFrame(track);

    return () => {
      alive = false;
      tracking = false;
      window.clearTimeout(timeout);
      hero?.removeEventListener("transitionend", onHeroEnd);
      window.removeEventListener("resize", refresh);
      for (const animation of animations) animation.revert();
    };
}
