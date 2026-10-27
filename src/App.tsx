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

    const SPEED = 2.5;
    const EASE = 0.14;
    let target = el.scrollLeft;
    let raf = 0;
    let running = false;

    const clamp = (value: number) => {
      const max = el.scrollWidth - el.clientWidth;
      return Math.min(Math.max(value, 0), Math.max(max, 0));
    };

    const tick = () => {
      const current = el.scrollLeft;
      const next = current + (target - current) * EASE;
      if (Math.abs(target - next) < 0.4) {
        el.scrollLeft = target;
        running = false;
        raf = 0;
        return;
      }
      el.scrollLeft = next;
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
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
      target = clamp(target + delta * SPEED);
      start();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
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
          aria-label="Parcours horizontal"
        >
          <div className="top-track">
            <HeroPanel shrunk={heroShrunk} />

            <section className="panel collage" aria-label="Galerie visuelle">
              <div className="collage__base">
                <img src={gallery.workspace.src} alt={gallery.workspace.alt} />
              </div>
              <div className="collage__overlay">
                <img src={gallery.code.src} alt={gallery.code.alt} />
              </div>
            </section>

            <AboutPanel />

            <section className="panel origin" aria-label="Galerie" data-show-mark>
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
