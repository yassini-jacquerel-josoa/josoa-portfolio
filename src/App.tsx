import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { animate, stagger } from "animejs";
import { createDesktopScroll } from "./animations/desktopScroll";
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
// Vitesse de défilement globale : 0.8 réduit de 20 % pour un scroll plus lent.
const SCROLL_SPEED = 0.64;
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
  const scrollStageRef = useRef<HTMLDivElement>(null);
  const scrollContentRef = useRef<HTMLDivElement>(null);
  const jumpToRef = useRef<((left: number) => void) | null>(null);
  const scrollToProject = useCallback((left: number) => jumpToRef.current?.(left), []);
  useScrollMotion(scrollerRef);

  // Navigation et positionnement initial avant le premier affichage.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const desktopMotion = window.matchMedia(DESKTOP);
    const reduced = window.matchMedia(REDUCED_MOTION);
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    let pointerTimer = 0;
    let pointerStartedOnHash = false;
    let handledByPointer = false;

    const portrait = el.querySelector<HTMLElement>(".collage");
    const code = portrait?.querySelector<HTMLElement>(".collage__overlay");
    const hero = el.querySelector<HTMLElement>(".hero");
    const about = el.querySelector<HTMLElement>(".about");
    const aboutTitle = about?.querySelector<HTMLElement>(".about__title");
    const pinnedLines = aboutTitle?.querySelectorAll<HTMLElement>("[data-about-pin]");
    const aboutLines = aboutTitle ? [...aboutTitle.querySelectorAll<HTMLElement>(".about__line")] : [];
    const track = el.querySelector<HTMLElement>(".top-track");
    const galleryPanel = el.querySelector<HTMLElement>(".origin");
    const galleryBoxes = [...el.querySelectorAll<HTMLElement>(".origin__box")].map((node) => ({
      node,
      start: 0,
      distance: 1,
      progress: 0,
    }));
    let viewportWidth = 0;
    let scrollLimit = 0;
    let desktopScroll: ReturnType<typeof createDesktopScroll> | null = null;
    let projectedLeft = 0;
    let titleEntrance: ReturnType<typeof animate> | null = null;
    let titleEntranceStart = 0;
    let titleEntranceProgress = 0;

    const measureRail = () => {
      viewportWidth = el.clientWidth;
      scrollLimit = Math.max(0, el.scrollWidth - viewportWidth);
      desktopScroll?.resize(scrollLimit, viewportWidth, el.scrollLeft);
    };
    let portraitWidth = 0;
    let portraitShift = 0;
    let codeStart = 0;
    let codeDistance = 1;
    let codeProgress = 0;
    let titlePinStart = 0;
    let titlePinEnd = 0;
    let titlePinOffset = 0;

    // Intégrale du smoothstep : vitesse et accélération continues aux bornes du raccord.
    const smoothStart = (position: number, radius: number) => {
      if (position <= -radius) return 0;
      if (position >= radius) return position;
      const progress = (position + radius) / (radius * 2);
      return radius * progress ** 3 * (2 - progress);
    };

    const syncOpening = (left: number) => {
      if (!portrait || reduced.matches) return;
      if (desktopMotion.matches && portraitWidth > 0) {
        // Raccord entre le portrait à 1/5 de la vitesse du Hero et la piste à pleine vitesse.
        const offset = left - portraitWidth * 0.625;
        const radius = portraitWidth * 0.1;
        const shift = offset >= radius ? 0 : 0.8 * (offset - smoothStart(offset, radius));
        if (shift !== portraitShift) {
          portraitShift = shift;
          portrait.style.setProperty("--portrait-shift", `${shift}px`);
        }
      }
      const progress = Math.min(1, Math.max(0, (left - codeStart) / codeDistance));
      if (progress !== codeProgress) {
        codeProgress = progress;
        const eased = 1 - (1 - progress) ** 4;
        portrait.style.setProperty("--code-progress", String(eased));
      }
      if (!desktopMotion.matches) return;
      if (titleEntrance && viewportWidth > 0) {
        const progress = Math.min(1, Math.max(0, (left - titleEntranceStart) / (viewportWidth * 0.32)));
        if (progress !== titleEntranceProgress) {
          titleEntranceProgress = progress;
          titleEntrance.seek(progress * titleEntrance.duration);
        }
      }
      if (aboutTitle && titlePinEnd > titlePinStart) {
        // Même raccord doux qu'à l'ouverture, mais le suivi ne compense que
        // 70 % du défilement : les deux lignes glissent à vitesse constante,
        // sans accélération au milieu de la fenêtre ni à-coup aux bornes.
        const duration = titlePinEnd - titlePinStart;
        const radius = Math.min(48, duration * 0.25);
        const offset =
          (smoothStart(left - titlePinStart, radius) - smoothStart(left - titlePinEnd, radius)) * 0.7;
        if (offset !== titlePinOffset) {
          titlePinOffset = offset;
          aboutTitle.style.setProperty("--about-title-pin", `${offset}px`);
        }
      } else if (titlePinOffset !== 0) {
        titlePinOffset = 0;
        aboutTitle?.style.removeProperty("--about-title-pin");
      }
      for (const box of galleryBoxes) {
        const progress = Math.min(1, Math.max(0, (left - box.start) / box.distance));
        if (progress === box.progress) continue;
        box.progress = progress;
        box.node.style.setProperty("--gallery-progress", String(progress * progress * (3 - 2 * progress)));
      }
    };

    const measureOpening = () => {
      if (!portrait || !hero) return;
      const width = portrait.getBoundingClientRect().width;
      portraitWidth = width;
      const heroWidth = hero.offsetWidth;
      const initialPortraitLeft = desktopMotion.matches ? heroWidth - width / 2 : 0;
      const codeRight = initialPortraitLeft + (code ? code.offsetLeft + code.offsetWidth : 0);
      const revealSpeed = desktopMotion.matches ? 0.8 : 1;
      codeStart = Math.max(0, (heroWidth - codeRight) / revealSpeed);
      codeDistance = width * 0.8;
      if (desktopMotion.matches && about && aboutTitle && pinnedLines?.length) {
        const aboutStart = about.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
        titleEntranceStart = aboutStart - viewportWidth;
        const longestLine = Math.max(...[...pinnedLines].map((line) => line.offsetWidth));
        const available = Math.max(0, about.clientWidth - aboutTitle.offsetLeft - longestLine - 24);
        titlePinEnd = aboutStart;
        titlePinStart = titlePinEnd - Math.min(viewportWidth * 0.28, available);
      }
      if (galleryPanel && desktopMotion.matches) {
        const origin = el.getBoundingClientRect().left - el.scrollLeft;
        const panelStart = galleryPanel.getBoundingClientRect().left - origin - viewportWidth * 0.4;
        for (const box of galleryBoxes) {
          // 60 % de la section doit être visible. Le deuxième bloc attend aussi son entrée dans l'écran.
          box.start = Math.max(panelStart, box.node.getBoundingClientRect().left - origin - viewportWidth * 0.65);
          box.distance = viewportWidth * 0.5;
        }
      }
      syncOpening(el.scrollLeft);
    };

    const clamp = (value: number) => Math.min(scrollLimit, Math.max(0, value));

    const positionOf = (section: HTMLElement) => {
      if (section === el) return 0;
      const left =
        section.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft;
      return clamp(left);
    };

    const renderHorizontal = (next: number) => {
      projectedLeft = next;
      el.scrollLeft = next;
      syncOpening(next);
    };

    const jumpTo = (next: number) => {
      if (desktopScroll) desktopScroll.jumpTo(next);
      else renderHorizontal(next);
    };
    jumpToRef.current = (left) => jumpTo(clamp(left));

    const updateScrollDriver = () => {
      const stage = scrollStageRef.current;
      const content = scrollContentRef.current;
      const enabled = desktopMotion.matches && !reduced.matches && stage && content;
      if (enabled && !desktopScroll) {
        const left = el.scrollLeft;
        if (aboutLines.length > 0) {
          titleEntrance = animate(aboutLines, {
            autoplay: false,
            y: [32, 0],
            opacity: [0, 1],
            delay: stagger(120),
            duration: 900,
            ease: "outCubic",
          });
        }
        desktopScroll = createDesktopScroll(stage, content, renderHorizontal, SCROLL_SPEED);
        measureRail();
        desktopScroll.jumpTo(left);
      } else if (!enabled && desktopScroll) {
        const left = el.scrollLeft;
        desktopScroll.destroy();
        desktopScroll = null;
        titleEntrance?.revert();
        titleEntrance = null;
        titleEntranceProgress = 0;
        measureRail();
        renderHorizontal(clamp(left));
      }
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
      if (desktopScroll || event.ctrlKey || event.shiftKey || !event.cancelable) return;
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const delta = event.deltaY;
      const region = (event.target as Element | null)?.closest?.("[data-scroll-y], .nav");
      if (region instanceof HTMLElement && region.scrollHeight > region.clientHeight + 1) {
        const atTop = region.scrollTop <= 0;
        const atBottom = region.scrollTop + region.clientHeight >= region.scrollHeight - 1;
        if ((delta < 0 && !atTop) || (delta > 0 && !atBottom)) return;
      }

      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewportWidth : 1;
      event.preventDefault();
      jumpTo(clamp(el.scrollLeft + delta * unit * SCROLL_SPEED));
    };

    const navigate = (section: HTMLElement) => {
      jumpTo(positionOf(section));
      focusSection(section);
    };

    const visit = (section: HTMLElement) => {
      skipIntro();
      if (location.hash !== `#${section.id}`) {
        history.pushState(null, "", `#${section.id}`);
      }
      navigate(section);
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
      navigate(section);
    };

    const onResize = () => {
      updateScrollDriver();
      measureRail();
      measureOpening();
      if (!desktopMotion.matches) skipIntro();
    };

    const onMotionChange = () => {
      if (reduced.matches) skipIntro();
      onResize();
    };

    const onScroll = () => {
      const left = el.scrollLeft;
      // Le rendu de bureau a déjà appliqué la position fractionnaire. Un écart
      // supérieur à l'arrondi du navigateur signale un déplacement natif (focus).
      if (!desktopScroll || Math.abs(left - projectedLeft) > 1) syncOpening(left);
    };

    // Au téléphone, un glissement vertical continue le parcours horizontal.
    type TouchDrag = { x: number; y: number; lastY: number; left: number; axis: "x" | "y" | null };
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
      drag = { x: touch.clientX, y: touch.clientY, lastY: touch.clientY, left: el.scrollLeft, axis: null };
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!drag || event.touches.length !== 1) return;
      const touch = event.touches[0];
      const dx = touch.clientX - drag.x;
      const dy = touch.clientY - drag.lastY;
      drag.lastY = touch.clientY;
      if (drag.axis === null) {
        const totalY = touch.clientY - drag.y;
        if (Math.hypot(dx, totalY) < 8) return;
        drag.axis = Math.abs(totalY) > Math.abs(dx) ? "y" : "x";
      }
      if (drag.axis !== "y" || !dy) return;
      const region = (event.target as Element | null)?.closest?.("[data-scroll-y], .nav");
      if (region instanceof HTMLElement && verticalRoom(region, dy)) return;
      event.preventDefault();
      drag.left = clamp(drag.left - dy * SCROLL_SPEED);
      jumpTo(drag.left);
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

    updateScrollDriver();
    measureRail();
    const railObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => {
      measureRail();
      measureOpening();
    });
    railObserver?.observe(el);
    if (track) railObserver?.observe(track);
    pinnedLines?.forEach((line) => railObserver?.observe(line));

    // Décoder les visuels avant que la galerie n'entre dans le cadre.
    const galleryObserver = galleryPanel && new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      galleryPanel.querySelectorAll("img").forEach((image) => {
        void image.decode?.().catch(() => {});
      });
    }, { root: el, rootMargin: "0px 100%" });
    if (galleryPanel) galleryObserver?.observe(galleryPanel);

    const initialSection = location.hash ? sectionFromHash(location.hash) : null;
    if (initialSection) navigate(initialSection);
    measureOpening();
    return () => {
      jumpToRef.current = null;
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
      railObserver?.disconnect();
      galleryObserver?.disconnect();
      desktopScroll?.destroy();
      titleEntrance?.revert();
      history.scrollRestoration = previousRestoration;
      portrait?.style.removeProperty("--portrait-shift");
      portrait?.style.removeProperty("--code-progress");
      aboutTitle?.style.removeProperty("--about-title-pin");
      galleryBoxes.forEach(({ node }) => node.style.removeProperty("--gallery-progress"));
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
    <div className="scroll-stage" ref={scrollStageRef}>
      <div className="scroll-stage__content" ref={scrollContentRef}>
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
                <div className="opening-panels">
                  <HeroPanel />

                  <section className="panel collage" aria-label={t("aria.galleryVisual")}>
                    <div
                      className="collage__base"
                      role="img"
                      aria-label={gallery.portrait.alt}
                      style={{ backgroundImage: `url("${gallery.portrait.src}")` }}
                    />
                    <div
                      className="collage__overlay"
                      role="img"
                      aria-label={gallery.code.alt}
                      style={{ backgroundImage: `url("${gallery.code.src}")` }}
                    />
                  </section>
                </div>

                <AboutPanel />

                <section className="panel origin" aria-label={t("aria.gallery")} data-show-mark>
                  <div className="origin__boxes">
                    <div className="origin__box origin__box--a">
                      <div className="origin__stack">
                        <div className="origin__img origin__img--back">
                          <img
                            className="origin__back-image"
                            src={gallery.efficashPoster.src}
                            alt={gallery.efficashPoster.alt}
                            decoding="async"
                          />
                        </div>
                        <img
                          className="origin__img origin__img--front"
                          src={gallery.efficashLanding.src}
                          alt={gallery.efficashLanding.alt}
                          decoding="async"
                        />
                      </div>
                    </div>

                    <div className="origin__box origin__box--b">
                      <div className="origin__stack">
                        <div className="origin__img origin__img--back">
                          <img
                            className="origin__back-image"
                            src={gallery.efficashWordmark.src}
                            alt={gallery.efficashWordmark.alt}
                            decoding="async"
                          />
                        </div>
                        <img
                          className="origin__img origin__img--front"
                          src={gallery.dashboard.src}
                          alt={gallery.dashboard.alt}
                          decoding="async"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <PullQuotePanel />
                <ExperiencePanel />
                <ProjectsPanel scrollToProject={scrollToProject} />
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
      </div>
    </div>
  );
}

export default App;
