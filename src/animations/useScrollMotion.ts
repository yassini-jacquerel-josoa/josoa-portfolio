import { useEffect, type RefObject } from "react";
import { animate, onScroll, stagger } from "animejs";
import { MOBILE_SCROLL } from "./scrollLayout";

const ENTER = "right left";
const CROSS = "left right";
const ARRIVE = "68% start";
/** Même seuil que la mise en page tablette/téléphone dans App.css */
const DESKTOP_MOTION = "(min-width: 1041px)";

/**
 * Parallaxe et entrées adaptées à l’axe du parcours.
 */
export function useScrollMotion(rootRef: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = rootRef.current;
    if (!container) return;

    const desktop = window.matchMedia(DESKTOP_MOTION);
    const mobile = window.matchMedia(MOBILE_SCROLL);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let stop: (() => void) | undefined;

    const mount = () => {
      stop?.();
      stop = reduced.matches ? undefined : attachScrollMotion(container, desktop.matches, mobile.matches);
    };

    mount();
    desktop.addEventListener("change", mount);
    mobile.addEventListener("change", mount);
    reduced.addEventListener("change", mount);
    return () => {
      desktop.removeEventListener("change", mount);
      mobile.removeEventListener("change", mount);
      reduced.removeEventListener("change", mount);
      stop?.();
    };
  }, [rootRef]);
}

function attachScrollMotion(container: HTMLDivElement, desktop: boolean, mobile: boolean) {
  const animations: Array<ReturnType<typeof animate>> = [];
  const observers: Array<ReturnType<typeof onScroll>> = [];
  const verticalAnimations: Array<{
    animation: ReturnType<typeof animate>;
    target: HTMLElement;
    startAt: number;
    finishAt?: number;
    start: number;
    distance: number;
    progress: number;
  }> = [];

  const bind = (
    targets: HTMLElement | HTMLElement[],
    parameters: Parameters<typeof animate>[1],
    range: {
      target: HTMLElement;
      leave?: string;
      startAt?: number;
      finishAt?: number;
      sync?: boolean | "inOutSine";
    },
  ) => {
    const list = Array.isArray(targets) ? targets : [targets];
    if (list.length === 0) return;
    if (mobile) {
      const animation = animate(list, { ease: "inOutSine", ...parameters, autoplay: false });
      animations.push(animation);
      verticalAnimations.push({
        animation,
        target: range.target,
        startAt: range.startAt ?? 1,
        finishAt: range.finishAt,
        start: 0,
        distance: 1,
        progress: -1,
      });
      return;
    }

    const observer = onScroll({
      container,
      axis: "x",
      sync: range.sync ?? true,
      enter: ENTER,
      leave: range.leave ?? CROSS,
      target: range.target,
    });
    observers.push(observer);
    animations.push(animate(list, { ease: "inOutSine", ...parameters, autoplay: observer }));
  };

  const values = container.querySelector<HTMLElement>(".values");
  const rail = values?.querySelector<HTMLElement>(".values__rail-track");
  if (values && rail) {
    const accelerate = (progress: number) => progress * (0.65 + 0.35 * progress);
    bind(rail, { y: ["0%", mobile ? "-42%" : "-100%"], ease: accelerate }, { target: values });
    const stars = [...rail.querySelectorAll<HTMLElement>(".values__star")];
    bind(stars, { rotate: [0, 720], ease: accelerate }, { target: values });
  }

  if (mobile) {
    const hero = container.querySelector<HTMLElement>(".hero");
    const heroContent = hero?.querySelector<HTMLElement>(".hero__inner");
    if (hero && heroContent) {
      bind(heroContent, { y: [0, 104], opacity: [1, 0.48] }, {
        target: hero, startAt: -0.06, finishAt: -0.64,
      });
    }

    const collage = container.querySelector<HTMLElement>(".collage");
    const portrait = collage?.querySelector<HTMLElement>(".collage__base");
    const code = collage?.querySelector<HTMLElement>(".collage__overlay");
    if (collage && portrait && code) {
      const range = { target: collage, startAt: 0.92, finishAt: 0.25 };
      bind(portrait, { y: ["12%", "-12%"], scale: [0.92, 1] }, range);
      bind(code, { y: ["50%", "-32%"], scale: [0.86, 1] }, range);
    }

    const aboutTitle = container.querySelector<HTMLElement>(".about__title");
    if (aboutTitle) {
      bind([...aboutTitle.querySelectorAll<HTMLElement>(".about__line-text")], {
        y: [54, 0], opacity: [0.22, 1], delay: stagger(110),
      }, { target: aboutTitle, startAt: 0.88, finishAt: 0.32 });
    }

    container.querySelectorAll<HTMLElement>(".origin__box").forEach((box) => {
      const front = box.querySelector<HTMLElement>(".origin__img--front");
      const back = box.querySelector<HTMLElement>(".origin__img--back");
      const range = { target: box, startAt: 0.9, finishAt: 0.22 };
      if (back) bind(back, { scale: [1.25, 1], y: [24, 0] }, range);
      if (front) bind(front, { y: ["-14%", "78%"] }, range);
    });

    container.querySelectorAll<HTMLElement>(
      "[data-motion='enter'], [data-motion='mobile-enter'], .principles__row",
    ).forEach((node) => {
      bind(node, { y: [56, 0], opacity: [0.3, 1] }, {
        target: node, startAt: 0.88, finishAt: 0.36,
      });
    });
  } else if (desktop) {
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
        { target: node, leave: ARRIVE },
      );
    });
  }

  const renderVertical = () => {
    const top = container.scrollTop;
    for (const entry of verticalAnimations) {
      const progress = Math.min(1, Math.max(0, (top - entry.start) / entry.distance));
      if (progress === entry.progress) continue;
      entry.progress = progress;
      entry.animation.seek(progress * entry.animation.duration);
    }
  };

  // offsetTop suit le flux même quand la cible est déjà déplacée par l’animation.
  const layoutTop = (element: HTMLElement) => {
    let top = 0;
    for (let node: Element | null = element; node instanceof HTMLElement; node = node.offsetParent) {
      top += node.offsetTop;
    }
    return top;
  };

  const track = mobile ? container.querySelector<HTMLElement>(".top-track") : null;
  const measureVertical = () => {
    const origin = layoutTop(container);
    const height = container.clientHeight;
    // Les déplacements visuels peuvent dépasser la hauteur réelle de la piste.
    const contentHeight = track
      ? layoutTop(track) - origin + track.offsetHeight
      : container.scrollHeight;
    const maxScroll = Math.max(0, contentHeight - height);
    for (const entry of verticalAnimations) {
      const targetTop = layoutTop(entry.target) - origin;
      entry.start = targetTop - height * entry.startAt;
      const end = entry.finishAt === undefined
        ? targetTop + entry.target.offsetHeight
        : targetTop - height * entry.finishAt;
      entry.distance = Math.max(1, Math.min(end, maxScroll) - entry.start);
    }
    renderVertical();
  };

  const layoutObserver = mobile ? new ResizeObserver(measureVertical) : null;
  if (layoutObserver) {
    layoutObserver.observe(container);
    if (track) layoutObserver.observe(track);
    container.addEventListener("scroll", renderVertical, { passive: true });
    measureVertical();
  }

  return () => {
    layoutObserver?.disconnect();
    container.removeEventListener("scroll", renderVertical);
    for (const observer of observers) observer.revert();
    for (const animation of animations) animation.revert();
  };
}
