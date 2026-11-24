import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useScrollMotion } from "./animations/useScrollMotion";
import PanelChrome from "./components/PanelChrome";
import {
  AboutPanel,
  ContactPanel,
  EducationPanel,
  ExperiencePanel,
  HeroPanel,
  ProjectsPanel,
  PullQuotePanel,
  SkillsHighlightPanel,
  SkillsPanel,
} from "./components/profile/ProfilePanels";
import { gallery } from "./data/visuals";
import { t } from "./i18n/index.ts";
import "./App.css";
import "./animations/heroIntro.css";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const DESKTOP = "(min-width: 1041px)";

function App() {
  const [introPlaying, setIntroPlaying] = useState(() =>
    !window.location.hash &&
    window.matchMedia(DESKTOP).matches &&
    !window.matchMedia(REDUCED_MOTION).matches,
  );
  const introPlayingRef = useRef(introPlaying);

  const finishIntro = () => {
    if (!introPlayingRef.current) return;
    introPlayingRef.current = false;
    setIntroPlaying(false);
  };

  const [markVisible, setMarkVisible] = useState(false);
  const [scrollHint, setScrollHint] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useScrollMotion(scrollerRef, !introPlaying);

  // Navigation et positionnement initial avant le premier affichage.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const desktopMotion = window.matchMedia(DESKTOP);
    const reduced = window.matchMedia(REDUCED_MOTION);
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    let pointerTimer = 0;
    let target = el.scrollLeft;
    let expected = el.scrollLeft;
    let raf = 0;
    let previousFrame = 0;
    let running = false;
    let destination: HTMLElement | null = null;
    let pointerStartedOnHash = false;
    let handledByPointer = false;

    const clamp = (value: number) => {
      const max = el.scrollWidth - el.clientWidth;
      return Math.min(Math.max(value, 0), Math.max(max, 0));
    };

    const positionOf = (section: HTMLElement) => {
      if (section === el) return 0;
      const left =
        section.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
      return clamp(left);
    };

    const tick = (now: number) => {
      const frame = 1000 / 60;
      const elapsed = previousFrame ? now - previousFrame : frame;
      previousFrame = now;
      const base = desktopMotion.matches ? 0.085 : 0.14;
      const ease = 1 - (1 - base) ** (elapsed / frame);
      const next = expected + (target - expected) * ease;
      const landed = Math.abs(target - next) < 0.6;
      expected = landed ? target : next;
      el.scrollLeft = expected;
      if (landed) {
        destination = null;
        running = false;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      previousFrame = 0;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
      destination = null;
    };

    const jumpTo = (next: number) => {
      stop();
      target = expected = next;
      el.scrollLeft = next;
    };

    const skipIntro = () => {
      if (!introPlayingRef.current) return;
      introPlayingRef.current = false;
      flushSync(() => setIntroPlaying(false));
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") skipIntro();
    };

    const sectionFromHash = (hash: string) => {
      let id: string;
      try {
        id = decodeURIComponent(hash.slice(1));
      } catch {
        return null;
      }
      const section = id ? document.getElementById(id) : el;
      return section && (section === el || el.contains(section)) ? section : null;
    };

    const hashLinkFrom = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.("a[href^='#']");
      if (!(link instanceof HTMLAnchorElement) || !el.contains(link)) return null;
      return sectionFromHash(link.hash);
    };

    const focusSection = (section: HTMLElement) => {
      const focusTarget = section === el ? el.querySelector<HTMLElement>(".hero") ?? el : section;
      if (focusTarget.tabIndex < 0) focusTarget.setAttribute("tabindex", "-1");
      focusTarget.focus({ preventScroll: true });
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const region = (event.target as Element | null)?.closest?.("[data-scroll-y], .nav");
      if (region instanceof HTMLElement && region.scrollHeight > region.clientHeight + 1) {
        const vertical = Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
        const atTop = region.scrollTop <= 0;
        const atBottom = region.scrollTop + region.clientHeight >= region.scrollHeight - 1;
        if ((vertical < 0 && !atTop) || (vertical > 0 && !atBottom)) return;
      }

      const delta =
        Math.abs(event.deltaY) > Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      skipIntro();
      destination = null;
      const speed = desktopMotion.matches ? 2.05 : 2.5;
      const next = clamp(target + delta * speed);
      if (reduced.matches) jumpTo(next);
      else {
        target = next;
        start();
      }
    };

    const navigate = (section: HTMLElement, smooth: boolean) => {
      const next = positionOf(section);
      if (smooth && desktopMotion.matches && !reduced.matches) {
        destination = section;
        target = next;
        start();
      } else jumpTo(next);
      focusSection(section);
    };

    const visit = (section: HTMLElement) => {
      skipIntro();
      if (location.hash !== `#${section.id}`) {
        history.pushState(null, "", `#${section.id}`);
      }
      navigate(section, true);
    };

    const hasModifiers = (event: MouseEvent) =>
      event.ctrlKey || event.metaKey || event.shiftKey || event.altKey;

    const onNavPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || hasModifiers(event)) return;
      const match = hashLinkFrom(event);
      if (!match) return;
      // Le lien du menu vit dans le hero. S'il prend le focus, le navigateur
      // ramène le scroll vers lui quelques instants après l'arrivée.
      event.preventDefault();
      pointerStartedOnHash = true;
    };

    const onNavPointerUp = (event: PointerEvent) => {
      if (!pointerStartedOnHash) return;
      pointerStartedOnHash = false;
      const match = hashLinkFrom(event);
      if (!match) return;
      handledByPointer = true;
      window.clearTimeout(pointerTimer);
      pointerTimer = window.setTimeout(() => {
        handledByPointer = false;
      }, 0);
      visit(match);
    };

    const onNavClick = (event: MouseEvent) => {
      if (hasModifiers(event)) return;
      const match = hashLinkFrom(event);
      if (!match) return;
      event.preventDefault();
      if (handledByPointer) {
        handledByPointer = false;
        return;
      }
      visit(match);
    };

    const onLocationChange = () => {
      const section = sectionFromHash(location.hash);
      if (!section) return;
      skipIntro();
      navigate(section, false);
    };

    const onResize = () => {
      if (!desktopMotion.matches) skipIntro();
      if (destination) target = positionOf(destination);
    };

    const onMotionChange = () => {
      if (!reduced.matches) return;
      skipIntro();
      jumpTo(destination ? positionOf(destination) : el.scrollLeft);
    };

    const onScroll = () => {
      if (Math.abs(el.scrollLeft - expected) < 1 || destination) return;
      skipIntro();
      target = el.scrollLeft;
      expected = el.scrollLeft;
    };

    // Au téléphone, un glissement vertical continue le parcours horizontal.
    type TouchDrag = { x: number; y: number; scroll: number; axis: "x" | "y" | null };
    let drag: TouchDrag | null = null;

    const verticalRoom = (node: HTMLElement, dy: number) => {
      if (node.scrollHeight <= node.clientHeight + 1) return false;
      const atTop = node.scrollTop <= 0;
      const atBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 1;
      return (dy > 0 && !atTop) || (dy < 0 && !atBottom);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (desktopMotion.matches || event.touches.length !== 1) return;
      const touch = event.touches[0];
      drag = { x: touch.clientX, y: touch.clientY, scroll: el.scrollLeft, axis: null };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!drag || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - drag.x;
      const dy = touch.clientY - drag.y;
      if (drag.axis === null) {
        if (Math.hypot(dx, dy) < 8) return;
        drag.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
      }
      if (drag.axis !== "y") return;
      const region = (event.target as Element | null)?.closest?.("[data-scroll-y], .nav");
      if (region instanceof HTMLElement && verticalRoom(region, dy)) return;
      event.preventDefault();
      skipIntro();
      jumpTo(clamp(drag.scroll - dy));
    };

    const onTouchEnd = () => {
      drag = null;
    };

    el.addEventListener("focusin", skipIntro);
    document.addEventListener("keydown", onKeyDown, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onNavPointerDown);
    el.addEventListener("pointerup", onNavPointerUp);
    el.addEventListener("click", onNavClick);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    window.addEventListener("popstate", onLocationChange);
    window.addEventListener("hashchange", onLocationChange);
    window.addEventListener("resize", onResize);
    reduced.addEventListener("change", onMotionChange);

    const initialSection = location.hash ? sectionFromHash(location.hash) : null;
    if (initialSection) navigate(initialSection, false);
    return () => {
      el.removeEventListener("focusin", skipIntro);
      document.removeEventListener("keydown", onKeyDown, true);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onNavPointerDown);
      el.removeEventListener("pointerup", onNavPointerUp);
      el.removeEventListener("click", onNavClick);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("popstate", onLocationChange);
      window.removeEventListener("hashchange", onLocationChange);
      window.removeEventListener("resize", onResize);
      reduced.removeEventListener("change", onMotionChange);
      window.clearTimeout(pointerTimer);
      history.scrollRestoration = previousRestoration;
      stop();
    };
  }, []);

  // Indication tant que le parcours n'est pas fini et que personne ne scrolle.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || introPlaying) return;

    let shown = false;
    let idle = 0;

    const moreToCome = () => {
      const max = el.scrollWidth - el.clientWidth;
      return max > 24 && el.scrollLeft < max - 24;
    };

    const show = () => {
      if (!moreToCome()) {
        if (shown) {
          shown = false;
          setScrollHint(false);
        }
        return;
      }
      if (shown) return;
      shown = true;
      setScrollHint(true);
    };

    const arm = () => {
      if (shown) {
        shown = false;
        setScrollHint(false);
      }
      window.clearTimeout(idle);
      idle = window.setTimeout(show, 1100);
    };

    idle = window.setTimeout(show, 1600);
    el.addEventListener("scroll", arm, { passive: true });
    window.addEventListener("resize", arm);
    return () => {
      window.clearTimeout(idle);
      el.removeEventListener("scroll", arm);
      window.removeEventListener("resize", arm);
      setScrollHint(false);
    };
  }, [introPlaying]);

  // Chrome fixe (JOSOA + jac. YASSINI) dès la section about
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const nodes = [...scroller.querySelectorAll<HTMLElement>("[data-show-mark]")];
    const visible = new Set<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target);
          else visible.delete(entry.target);
        }
        setMarkVisible(visible.size > 0);
      },
      { root: scroller, threshold: 0.28 },
    );

    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="page">
      <div className="top-box">
        <PanelChrome
          variant="mark"
          visible={markVisible}
          className="panel-chrome--fixed"
        />

        <div
          className={`top-scroller${introPlaying ? " top-scroller--intro" : ""}`}
          ref={scrollerRef}
          id="top"
          aria-label={t("aria.scroller")}
        >
          <div
            className="top-track"
            onAnimationEnd={(event) => {
              if (event.animationName === "hero-last-labels") finishIntro();
            }}
          >
            <HeroPanel />

            <section className="panel collage" aria-label={t("aria.galleryVisual")}>
              <div className="collage__base">
                <img src={gallery.workspace.src} alt={gallery.workspace.alt} />
              </div>
              <div className="collage__overlay">
                <img src={gallery.code.src} alt={gallery.code.alt} />
              </div>
            </section>

            <AboutPanel />

            <section className="panel origin" aria-label={t("aria.gallery")} data-show-mark>
              <div className="origin__boxes">
                <div className="origin__box origin__box--a">
                  <div className="origin__stack">
                    <img
                      className="origin__img origin__img--back"
                      src={gallery.architecture.src}
                      alt={gallery.architecture.alt}
                    />
                    <img
                      className="origin__img origin__img--front"
                      src={gallery.mobile.src}
                      alt={gallery.mobile.alt}
                    />
                  </div>
                </div>

                <div className="origin__box origin__box--b">
                  <div className="origin__stack">
                    <img
                      className="origin__img origin__img--back"
                      src={gallery.stage.src}
                      alt={gallery.stage.alt}
                    />
                    <img
                      className="origin__img origin__img--front"
                      src={gallery.dashboard.src}
                      alt={gallery.dashboard.alt}
                    />
                  </div>
                </div>
              </div>
            </section>

            <PullQuotePanel />
            <ExperiencePanel />
            <ProjectsPanel />
            <EducationPanel />
            <SkillsHighlightPanel />
            <SkillsPanel />
            <ContactPanel />
          </div>
        </div>

        <p className={`scroll-hint${scrollHint ? " is-on" : ""}`} aria-hidden="true">
          <span>{t("scroll.hint")}</span>
        </p>
      </div>
    </div>
  );
}

export default App;
