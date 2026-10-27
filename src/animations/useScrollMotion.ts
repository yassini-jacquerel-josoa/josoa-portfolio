import { useEffect, type RefObject } from "react";
import { animate, onScroll, stagger, type ScrollObserver } from "animejs";

const ENTER = "right left";
const CROSS = "left right";
const REVEAL = "center center";
const ARRIVE = "76% start";

/**
 * Parallax et entrées liées au scroll horizontal.
 * Le hero se rétracte en 1,4 s : on recalcule les seuils pendant cette transition.
 */
export function useScrollMotion(rootRef: RefObject<HTMLDivElement | null>, ready: boolean) {
  useEffect(() => {
    const container = rootRef.current;
    if (!container || !ready) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const animations: Array<ReturnType<typeof animate>> = [];
    const observers: ScrollObserver[] = [];
    let alive = true;

    const bind = (
      targets: HTMLElement | HTMLElement[],
      parameters: Parameters<typeof animate>[1],
      range: { target: HTMLElement; enter?: string; leave?: string },
    ) => {
      const list = Array.isArray(targets) ? targets : [targets];
      if (list.length === 0) return;
      const observer = onScroll({
        container,
        axis: "x",
        sync: true,
        enter: range.enter ?? ENTER,
        leave: range.leave ?? CROSS,
        target: range.target,
      });
      observers.push(observer);
      animations.push(animate(list, { ...parameters, autoplay: observer }));
    };

    const collage = container.querySelector<HTMLElement>(".collage");
    const base = container.querySelector<HTMLElement>(".collage__base img");
    const overlay = container.querySelector<HTMLElement>(".collage__overlay img");
    if (collage && base) {
      bind(
        base,
        { x: ["7%", "-11%"], y: ["-3%", "4%"], scale: [1.14, 1.04], ease: "linear" },
        { target: collage },
      );
    }
    if (collage && overlay) {
      bind(
        overlay,
        { x: ["-12%", "9%"], y: ["5%", "-4%"], scale: [1.16, 1.02], ease: "linear" },
        { target: collage },
      );
    }

    container.querySelectorAll<HTMLElement>(".origin__box").forEach((box, index) => {
      const back = box.querySelector<HTMLElement>(".origin__img--back");
      const front = box.querySelector<HTMLElement>(".origin__img--front");
      if (back) {
        bind(
          back,
          {
            x: index === 0 ? ["-7%", "7%"] : ["6%", "-8%"],
            y: index === 0 ? ["3%", "-4%"] : ["-3%", "5%"],
            scale: [1.12, 1.04],
            ease: "linear",
          },
          { target: box },
        );
      }
      if (front) {
        bind(
          front,
          { x: ["0%", "108%"], ease: "inOutCubic" },
          { target: box, enter: ENTER, leave: REVEAL },
        );
      }
    });

    const about = container.querySelector<HTMLElement>(".about");
    const aboutLines = [...container.querySelectorAll<HTMLElement>(".about__line")];
    if (about && aboutLines.length > 0) {
      bind(
        aboutLines,
        {
          y: [26, 0],
          opacity: [0, 1],
          delay: stagger(110),
          duration: 720,
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
        { x: ["9%", "-8%"], scale: [1.18, 1.03], ease: "linear" },
        { target: card },
      );
    });

    const principles = container.querySelector<HTMLElement>(".principles");
    if (principles) {
      const shifts: Array<[string, string]> = [
        ["2.4vw", "-3.6vw"],
        ["-1.8vw", "4.2vw"],
        ["3vw", "-2.2vw"],
      ];
      container.querySelectorAll<HTMLElement>(".principles__row").forEach((row, index) => {
        bind(row, { x: shifts[index] ?? ["1vw", "-1vw"], ease: "linear" }, { target: principles });
      });
    }

    container.querySelectorAll<HTMLElement>("[data-motion='enter']").forEach((node) => {
      bind(
        node,
        { y: [22, 0], opacity: [0, 1], duration: 800, ease: "outCubic" },
        { target: node, enter: ENTER, leave: ARRIVE },
      );
    });

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
  }, [ready, rootRef]);
}
