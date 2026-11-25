import { useLayoutEffect, type RefObject } from "react";
import { MOBILE_SCROLL } from "./scrollLayout";

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const smoothStep = (progress: number) => progress * progress * (3 - 2 * progress);

export function useProjectsMotion(
  sectionRef: RefObject<HTMLElement | null>,
  scrollToProject?: (left: number) => void,
) {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    const scroller = section?.closest<HTMLElement>(".top-scroller");
    if (!section || !scroller) return;

    const slots = [...section.querySelectorAll<HTMLElement>(".project-card-slot")];
    const firstSlot = slots[0];
    if (!firstSlot) return;
    const mediaFrames = slots.map((slot) => slot.querySelector<HTMLElement>(".project-card__media"));

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileScroll = window.matchMedia(MOBILE_SCROLL);
    let origin = 0;
    let viewport = 0;
    let fullWidth = 0;
    let previewWidth = 0;
    let frame = 0;

    const render = () => {
      frame = 0;
      if (mobileScroll.matches) {
        const top = scroller.getBoundingClientRect().top;
        const progressBySlot = slots.map((slot, index) => {
          const offset = slot.getBoundingClientRect().top - top;
          const captionOffset = offset + (mediaFrames[index]?.offsetHeight ?? 0);
          return {
            card: clamp((0.96 - offset / viewport) / 0.56),
            caption: clamp((0.9 - captionOffset / viewport) / 0.48),
          };
        });
        slots.forEach((slot, index) => {
          const { card, caption } = progressBySlot[index];
          slot.style.setProperty("--project-open", String(smoothStep(card)));
          slot.style.setProperty("--project-caption-open", String(smoothStep(caption)));
        });
        return;
      }
      let left = origin - scroller.scrollLeft;
      let shift = 0;

      // Les emplacements gardent leur largeur pour stabiliser le défilement
      // et les ancres. Seules les cartes se resserrent et se rapprochent.
      for (const slot of slots) {
        const progress = clamp((0.82 - left / viewport) / 0.31);
        const open = smoothStep(progress);
        const width = previewWidth + (fullWidth - previewWidth) * open;

        slot.style.setProperty("--project-shift", `${shift}px`);
        slot.style.setProperty("--project-width", `${width}px`);
        slot.style.setProperty("--project-open", String(open));
        slot.toggleAttribute("data-preview", open < 0.8);
        shift += width - fullWidth;
        left += width;
      }
    };

    const schedule = () => {
      if (!frame && viewport > 0 && !reducedMotion.matches) {
        frame = requestAnimationFrame(render);
      }
    };

    const measure = () => {
      if (mobileScroll.matches) {
        viewport = scroller.clientHeight;
        schedule();
        return;
      }
      viewport = scroller.clientWidth;
      fullWidth = firstSlot.getBoundingClientRect().width;
      origin =
        firstSlot.getBoundingClientRect().left - scroller.getBoundingClientRect().left +
        scroller.scrollLeft;
      previewWidth = Math.min(fullWidth, viewport * (viewport > 1040 ? 0.15 : 0.35));
      schedule();
    };

    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const slot of slots) {
        slot.style.removeProperty("--project-shift");
        slot.style.removeProperty("--project-width");
        slot.style.removeProperty("--project-open");
        slot.style.removeProperty("--project-caption-open");
        slot.removeAttribute("data-preview");
      }
    };

    const onMotionChange = () => {
      reset();
      if (!reducedMotion.matches) measure();
    };

    const onFocus = (event: FocusEvent) => {
      const button = event.target;
      if (!(button instanceof HTMLButtonElement) || reducedMotion.matches || mobileScroll.matches) return;
      const slot = button.closest<HTMLElement>(".project-card-slot");
      if (!slot) return;
      const bounds = button.getBoundingClientRect();
      if (!slot.hasAttribute("data-preview") && bounds.left >= 0 && bounds.right <= viewport) return;

      const left = origin + slots.indexOf(slot) * fullWidth - (viewport - fullWidth) / 2;
      if (scrollToProject) scrollToProject(left);
      else scroller.scrollLeft = left;
      cancelAnimationFrame(frame);
      render();
    };

    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    observer.observe(section);
    if (section.parentElement) observer.observe(section.parentElement);
    measure();
    scroller.addEventListener("scroll", schedule, { passive: true });
    section.addEventListener("focusin", onFocus);
    reducedMotion.addEventListener("change", onMotionChange);
    mobileScroll.addEventListener("change", onMotionChange);
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", schedule);
      section.removeEventListener("focusin", onFocus);
      reducedMotion.removeEventListener("change", onMotionChange);
      mobileScroll.removeEventListener("change", onMotionChange);
      reset();
    };
  }, [sectionRef, scrollToProject]);
}
