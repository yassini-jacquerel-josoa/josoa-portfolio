import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function createDesktopScroll(
  stage: HTMLElement,
  content: HTMLElement,
  renderHorizontal: (left: number) => void,
  scrollSpeed: number,
) {
  gsap.registerPlugin(ScrollTrigger);
  stage.classList.add("scroll-stage--driven");
  stage.tabIndex = 0;

  let horizontalLimit = 0;
  let verticalLimit = 0;
  const projection = { progress: 0 };

  // Même chaîne que la référence : Lenis lisse l'entrée verticale, ScrollTrigger suit avec un scrub.
  const lenis = new Lenis({
    wrapper: stage,
    content,
    orientation: "vertical",
    gestureOrientation: "both",
    lerp: 0.1,
    allowNestedScroll: true,
    virtualScroll: ({ event }) => event.cancelable && !event.ctrlKey,
    autoResize: false,
  });
  const animation = gsap.to(projection, {
    progress: 1,
    ease: "none",
    duration: 1,
    paused: true,
    onUpdate: () => renderHorizontal(projection.progress * horizontalLimit),
  });
  const trigger = ScrollTrigger.create({
    scroller: stage,
    animation,
    start: 0,
    end: () => Math.max(1, verticalLimit),
    scrub: 1,
  });

  const update = () => ScrollTrigger.update();
  const tick = (seconds: number) => lenis.raf(seconds * 1000);
  const off = lenis.on("scroll", update);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);

  const jumpTo = (left: number) => {
    const ratio = horizontalLimit ? Math.min(1, Math.max(0, left / horizontalLimit)) : 0;
    lenis.scrollTo(ratio * verticalLimit, { immediate: true, force: true });
    ScrollTrigger.update();
    trigger.getTween()?.progress(1);
    animation.progress(ratio);
    renderHorizontal(ratio * horizontalLimit);
  };

  return {
    resize(limit: number, width: number, left: number) {
      // Le parcours source dépend de la largeur de la piste et de la hauteur visible.
      const distance = limit && width
        ? Math.round((limit + width) * stage.clientHeight / (width * scrollSpeed))
        : 0;
      if (distance === verticalLimit && limit === horizontalLimit) return;
      horizontalLimit = limit;
      verticalLimit = distance;
      content.style.setProperty("--scroll-projection-distance", `${distance}px`);
      lenis.resize();
      trigger.refresh();
      jumpTo(left);
    },
    jumpTo,
    destroy() {
      off();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      trigger.kill();
      animation.kill();
      lenis.destroy();
      stage.classList.remove("scroll-stage--driven");
      stage.removeAttribute("tabindex");
      content.style.removeProperty("--scroll-projection-distance");
    },
  };
}
