import { useEffect, useRef, useState, type CSSProperties } from "react";
import PanelChrome from "./components/PanelChrome";
import "./App.css";

function App() {
  const [heroShrunk, setHeroShrunk] = useState(false);
  const [markVisible, setMarkVisible] = useState(false);
  const [originReveal, setOriginReveal] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const originRef = useRef<HTMLElement>(null);
  const valuesRef = useRef<HTMLElement>(null);

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

    const onWheel = (e: WheelEvent) => {
      const delta =
        Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!delta) return;
      e.preventDefault();
      target = clamp(target + delta * SPEED);
      start();
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Reveal des images empilées (section Origin) selon le scroll horizontal
  useEffect(() => {
    const scroller = scrollerRef.current;
    const origin = originRef.current;
    if (!scroller || !origin) return;

    const update = () => {
      const originStart = origin.offsetLeft - scroller.clientWidth * 0.15;
      const originEnd = origin.offsetLeft + origin.offsetWidth * 0.55;
      const originRange = Math.max(originEnd - originStart, 1);
      setOriginReveal(
        Math.min(1, Math.max(0, (scroller.scrollLeft - originStart) / originRange)),
      );
    };

    update();
    scroller.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      scroller.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Chrome fixe (JOSOA + jac. YASSINI) dès la section about
  useEffect(() => {
    const scroller = scrollerRef.current;
    const about = aboutRef.current;
    const origin = originRef.current;
    const values = valuesRef.current;
    if (!scroller || !about || !origin || !values) return;

    const state = { about: false, origin: false, values: false };

    const sync = () => {
      setMarkVisible(state.about || state.origin || state.values);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === about) state.about = entry.isIntersecting;
          if (entry.target === origin) state.origin = entry.isIntersecting;
          if (entry.target === values) state.values = entry.isIntersecting;
        }
        sync();
      },
      { root: scroller, threshold: 0.28 },
    );

    observer.observe(about);
    observer.observe(origin);
    observer.observe(values);
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
            {/* ——— 1. Hero ——— */}
            <section
              className={`panel hero${heroShrunk ? " hero--shrunk" : ""}`}
              aria-label="Accueil"
            >
              <PanelChrome variant="hero" />

              <a className="home-link" href="#top">
                Bienvenue
              </a>

              <div className="hero__inner">
                <h1 className="hero__title">
                  <span className="hero__line hero__line--a">DES IDÉES QUI</span>
                  <span className="hero__line hero__line--b">PRENNENT VIE</span>
                  <span className="hero__line hero__line--c">
                    <span className="hero__lo">AVEC</span>
                    <span className="hero__ordinario">SOIN</span>
                  </span>
                </h1>

                <p className="hero__copy">
                  Salut — je suis Josoa, développeur depuis plus de 6 ans.
                  J&apos;aime construire des produits utiles, clairs et durables
                  : web, mobile et un peu d&apos;IA quand ça aide vraiment. Basé
                  à Nosy-Be, toujours content d&apos;échanger.
                </p>
              </div>
            </section>

            {/* ——— 2. Collage images ——— */}
            <section className="panel collage" aria-label="Galerie visuelle">
              <div className="collage__base">
                <img
                  src="/images/collage-main.jpg"
                  alt="Intérieur chaleureux — atmosphère de travail soignée"
                />
              </div>
              <div className="collage__overlay">
                <img
                  src="/images/collage-detail.jpg"
                  alt="Détail d’un espace calme et compositionné"
                />
              </div>
            </section>

            {/* ——— 3. About ——— */}
            <section
              className="panel about"
              id="apropos"
              aria-label="À propos"
              ref={aboutRef}
            >
              <div className="about__box">
                <p className="about__label">Moi</p>

                <div className="about__content">
                  <h2 className="about__title">
                    <span className="about__line about__line--1">
                      DES IDÉES QUI
                    </span>
                    <span className="about__line about__line--2">
                      INVITENT À
                    </span>
                    <span className="about__line about__line--3">
                      PRENDRE LE
                    </span>
                    <span className="about__line about__line--4">
                      TEMPS ET CRÉER
                    </span>
                  </h2>

                  <p className="about__text">
                    Chaque projet mérite d&apos;être clair, utile et un peu
                    personnel — comme les personnes pour qui on le construit. Je
                    travaille le web, le mobile et l&apos;IA quand ça aide vraiment,
                    avec le souci de livrer quelque chose de solide et agréable
                    à vivre au quotidien. Depuis Nosy-Be, j&apos;aime poser des
                    bases propres, avancer avec soin, et laisser de la place à ce
                    qui compte.
                  </p>
                </div>
              </div>
            </section>

            {/* ——— 4. Origin : 2 boxes, images empilées + reveal au scroll ——— */}
            <section
              className="panel origin"
              id="projets"
              aria-label="Projets"
              ref={originRef}
              style={{ "--origin-reveal": String(originReveal) } as CSSProperties}
            >
              <div className="origin__boxes">
                <div className="origin__box origin__box--a">
                  <div className="origin__stack">
                    <img
                      className="origin__img origin__img--back"
                      src="/images/gallery-2.jpg"
                      alt="Détail d’ambiance — couche basse"
                    />
                    <img
                      className="origin__img origin__img--front"
                      src="/images/gallery-1.jpg"
                      alt="Espace de vie — couche haute"
                    />
                  </div>
                </div>

                <div className="origin__box origin__box--b">
                  <div className="origin__stack">
                    <img
                      className="origin__img origin__img--back"
                      src="/images/gallery-4.jpg"
                      alt="Ambiance nocturne — couche basse"
                    />
                    <img
                      className="origin__img origin__img--front"
                      src="/images/gallery-3.jpg"
                      alt="Terrasse — couche haute"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ——— 5. Valeurs ——— */}
            <section
              className="panel values"
              id="valeurs"
              aria-label="Valeurs"
              ref={valuesRef}
            >
              <div className="values__body">
                <p className="values__text">
                  Je crois aux produits qui durent : une architecture propre, une
                  équipe qui apprend, et une expérience qui reste simple pour
                  ceux qui l’utilisent. Laravel, mobile, IA — toujours au
                  service d’un vrai besoin, jamais pour la démo.
                </p>
              </div>

              <aside className="values__rail" aria-hidden="true">
                <div className="values__rail-track">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div className="values__rail-item" key={i}>
                      <p className="values__label">VALEURS</p>
                      <span className="values__star">*</span>
                    </div>
                  ))}
                </div>
              </aside>
            </section>

            {/* ——— 6. Principes ——— */}
            <section className="panel principles" aria-label="Principes">
              <div className="principles__row principles__row--one">
                <span className="principles__index">01</span>
                <h2>ARCHITECTURE</h2>
              </div>

              <div className="principles__row principles__row--two">
                <span className="principles__index">02</span>
                <h2>EXPÉRIENCE</h2>
              </div>

              <p className="principles__copy">
                Du web au mobile, en passant par l’IA : des systèmes clairs,
                maintenables et utiles. Laravel, produits SaaS et interfaces
                pensés pour servir le métier — pas juste pour impressionner.
              </p>

              <div className="principles__row principles__row--three">
                <span className="principles__index">03</span>
                <h2>PERFORMANCE</h2>
              </div>
            </section>

            {/* ——— 7. Projets sélectionnés ——— */}
            <section
              className="panel projects-showcase"
              aria-label="Projets sélectionnés"
            >
              <p className="projects-showcase__label">Projets</p>

              <article className="project-card project-card--one">
                <img
                  className="project-card__image"
                  src="/images/gallery-1.jpg"
                  alt="Wondergeorge — plateforme SaaS"
                />
                <div className="project-card__meta">
                  <span>2023—2024</span>
                  <span>SAAS / IA</span>
                </div>
                <h3>WONDERGEORGE</h3>
                <span className="project-card__number">01</span>
              </article>

              <article className="project-card project-card--two">
                <img
                  className="project-card__image"
                  src="/images/gallery-3.jpg"
                  alt="MyRacingCoach — application de coaching"
                />
                <div className="project-card__meta">
                  <span>2024</span>
                  <span>MOBILE / IA</span>
                </div>
                <h3>MYRACINGCOACH</h3>
                <span className="project-card__number">02</span>
              </article>

              <article className="project-card project-card--three">
                <img
                  className="project-card__image"
                  src="/images/gallery-4.jpg"
                  alt="SmartBots — assistant multi-services"
                />
                <div className="project-card__meta">
                  <span>2025</span>
                  <span>AGENTS IA</span>
                </div>
                <h3>SMARTBOTS</h3>
                <span className="project-card__number">03</span>
              </article>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
