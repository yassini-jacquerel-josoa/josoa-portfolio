import { useEffect, useRef, useState } from "react";
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

function App() {
  const [heroShrunk, setHeroShrunk] = useState(false);
  const [markVisible, setMarkVisible] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  useScrollMotion(scrollerRef, heroShrunk);

  useEffect(() => {
    const timer = window.setTimeout(() => setHeroShrunk(true), 3_000);
    return () => window.clearTimeout(timer);
  }, []);

  // Molette → scroll horizontal rapide + lissé (lerp)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const desktopMotion = window.matchMedia("(min-width: 1041px)");
    let target = el.scrollLeft;
    let expected = el.scrollLeft;
    let raf = 0;
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

    const heroIsMoving = () => {
      const hero = el.querySelector(".hero");
      if (!hero) return false;
      return hero.getAnimations().some((animation) => animation.playState === "running");
    };

    const tick = () => {
      if (destination) target = positionOf(destination);
      const ease = desktopMotion.matches ? 0.085 : 0.14;
      const current = el.scrollLeft;
      const next = current + (target - current) * ease;
      const landed = Math.abs(target - current) < 0.6;
      expected = landed ? target : next;
      el.scrollLeft = expected;
      if (landed) {
        if (destination && heroIsMoving()) {
          raf = requestAnimationFrame(tick);
          return;
        }
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
      raf = requestAnimationFrame(tick);
    };

    const hashLinkFrom = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.("a[href^='#']");
      if (!(link instanceof HTMLAnchorElement) || !el.contains(link)) return null;
      const id = link.getAttribute("href")?.slice(1);
      const section = id ? document.getElementById(id) : null;
      if (!section || (section !== el && !el.contains(section))) return null;
      return { link, section };
    };

    const focusSection = (section: HTMLElement) => {
      const focusTarget = section === el ? el.querySelector<HTMLElement>(".hero") ?? el : section;
      if (focusTarget.tabIndex < 0) focusTarget.tabIndex = -1;
      focusTarget.focus({ preventScroll: true });
    };

    const onWheel = (event: WheelEvent) => {
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
      destination = null;
      const speed = desktopMotion.matches ? 2.05 : 2.5;
      target = clamp(target + delta * speed);
      start();
    };

    const visit = (section: HTMLElement) => {
      focusSection(section);
      const next = positionOf(section);
      if (location.hash !== `#${section.id}`) {
        history.pushState(null, "", `#${section.id}`);
      }
      if (!desktopMotion.matches) {
        destination = null;
        target = next;
        expected = next;
        el.scrollLeft = next;
        if (raf) cancelAnimationFrame(raf);
        running = false;
        return;
      }
      destination = section;
      target = next;
      start();
    };

    const onNavPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
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
      window.setTimeout(() => {
        handledByPointer = false;
      }, 0);
      visit(match.section);
    };

    const onNavClick = (event: MouseEvent) => {
      const match = hashLinkFrom(event);
      if (!match) return;
      event.preventDefault();
      if (handledByPointer) {
        handledByPointer = false;
        return;
      }
      visit(match.section);
    };

    const onPopState = () => {
      const id = location.hash.slice(1);
      const section = id ? document.getElementById(id) : el;
      if (!section || (section !== el && !el.contains(section))) return;
      focusSection(section);
      destination = desktopMotion.matches ? section : null;
      target = positionOf(section);
      if (destination) start();
      else {
        expected = target;
        el.scrollLeft = target;
      }
    };

    const onScroll = () => {
      if (Math.abs(el.scrollLeft - expected) < 1 || destination) return;
      target = el.scrollLeft;
      expected = el.scrollLeft;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onNavPointerDown);
    el.addEventListener("pointerup", onNavPointerUp);
    el.addEventListener("click", onNavClick);
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("popstate", onPopState);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onNavPointerDown);
      el.removeEventListener("pointerup", onNavPointerUp);
      el.removeEventListener("click", onNavClick);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("popstate", onPopState);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

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
          className={`top-scroller${heroShrunk ? " top-scroller--open" : ""}`}
          ref={scrollerRef}
          id="top"
          aria-label={t("aria.scroller")}
        >
          <div className="top-track">
            <HeroPanel shrunk={heroShrunk} />

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
      </div>
    </div>
  );
}

export default App;
