import { t } from "../../i18n/index.ts";
import PanelChrome from "../PanelChrome.tsx";
import {
  cityOf,
  firstSentence,
  formatEducationPeriod,
  formatExperiencePeriod,
  headlineBits,
  lastSentence,
  phoneHref,
  profile,
  sentences,
  whatsappHref,
} from "../../data/profile.ts";

export { default as ProjectsPanel } from "./ProjectsPanel.tsx";
const DEVELOPMENT_STEPS = ["architecture", "implementation", "validation"] as const;

export function HeroPanel() {
  const bits = headlineBits(profile.headline);

  return (
    <section className="panel hero" aria-label={t("aria.home")}>
      <PanelChrome variant="hero" />
      <a className="home-link" href="#top">
        {t("aria.welcome")}
      </a>

      <div className="hero__inner" data-scroll-y>
        <h1 className="hero__title">
          <span className="hero__line hero__line--a">{bits.lineA}</span>{" "}
          {bits.lineB !== bits.lineA && <span className="hero__line hero__line--b">{bits.lineB}</span>}{" "}
          <span className="hero__line hero__line--c">
            {bits.prefix ? <span className="hero__lo">{bits.prefix}</span> : null}
            <span className="hero__ordinario">{bits.accent}</span>
          </span>
        </h1>

        <p className="hero__copy">
          {profile.identity.fullName}
          <br />
          {profile.identity.location}
          <br />
          <br />
          {firstSentence(profile.about)}
        </p>
      </div>
    </section>
  );
}

export function AboutPanel() {
  const bits = headlineBits(profile.headline);

  return (
    <section
      className="panel about"
      id="apropos"
      aria-label={t("aria.about")}
      data-show-mark
    >
      <div className="about__box">
        <p className="about__label">{t("nav.about")}</p>
        <div className="about__content">
          <h2 className="about__title">
            {bits.aboutLines.map((line, index) => (
              <span
                className={`about__line about__line--${index + 1}`}
                data-about-pin={index === 1 || index === 3 ? "" : undefined}
                key={`${line}-${index}`}
              >
                {line}
              </span>
            ))}
          </h2>
          <p className="about__text" data-scroll-y data-motion="enter">
            {sentences(profile.about).slice(1, -1).join(" ")}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PullQuotePanel() {
  return (
    <section className="panel values" data-show-mark aria-label={t("aria.profile")}>
      <div className="values__body">
        <p className="values__text" data-motion="enter">
          {lastSentence(profile.about)}
        </p>
      </div>
      <aside className="values__rail" aria-hidden="true">
        <div className="values__rail-track">
          {Array.from({ length: 16 }, (_, index) => (
            <div className="values__rail-item" key={index}>
              <p className="values__label">{cityOf(profile.identity.location)}</p>
              <span className="values__star">*</span>
            </div>
          ))}
        </div>
      </aside>
    </section>
  );
}

export function ExperiencePanel() {
  return (
    <section
      className="panel record-row"
      id="experience"
      aria-label={t("aria.experience")}
      data-show-mark
    >
      <p className="panel-label">{t("nav.experience")}</p>
      {profile.experience.map((job) => (
        <article
          className="record-card"
          data-scroll-y
          data-motion="enter"
          key={`${job.organization}-${job.title}`}
        >
          {job.current ? <span className="badge">{t("badge.currentJob")}</span> : null}
          <p className="record-card__period">{formatExperiencePeriod(job)}</p>
          <h3>{job.title}</h3>
          <p className="record-card__org">{job.organization}</p>
          <p className="record-card__meta">
            {[job.employmentType, job.location].filter(Boolean).join(" · ")}
          </p>
          <p className="record-card__text">{job.description}</p>
          {job.skills && job.skills.length > 0 ? (
            <>
              <p className="record-card__kicker">{t("skills.kicker")}</p>
              <p className="record-card__skills">{job.skills.join(" · ")}</p>
            </>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export function EducationPanel() {
  return (
    <section
      className="panel record-row"
      id="formation"
      aria-label={t("aria.education")}
      data-show-mark
    >
      <p className="panel-label">{t("nav.education")}</p>
      {profile.education.map((item) => (
        <article
          className="record-card"
          data-scroll-y
          data-motion="enter"
          key={`${item.school}-${item.degree}`}
        >
          {item.current ? <span className="badge">{t("badge.inProgress")}</span> : null}
          <p className="record-card__period">{formatEducationPeriod(item)}</p>
          <h3>{item.degree}</h3>
          {item.field ? <p className="record-card__org">{item.field}</p> : null}
          <p className="record-card__meta">{item.school}</p>
          {item.description ? <p className="record-card__text">{item.description}</p> : null}
          {item.mention ? (
            <p className="record-card__text">
              {t("education.mention")} {item.mention}
            </p>
          ) : null}
          {item.notes ? <p className="record-card__text">{item.notes}</p> : null}
        </article>
      ))}
    </section>
  );
}

export function SkillsHighlightPanel() {
  return (
    <section className="panel principles" data-show-mark aria-label={t("principles.label")}>
      {DEVELOPMENT_STEPS.map((step, index) => (
        <div className="principles__row" key={step}>
          <span className="principles__index">0{index + 1}</span>
          <h2>{t(`principles.${step}`)}</h2>
        </div>
      ))}
    </section>
  );
}

export function SkillsPanel() {
  return (
    <section
      className="panel skills"
      id="competences"
      aria-label={t("aria.skills")}
      data-show-mark
    >
      <p className="panel-label">{t("nav.skills")}</p>
      <div className="skills__grid" data-scroll-y>
        {profile.skills.map((group) => (
          <div className="skills__group" data-motion="enter" key={group.category}>
            <h3>{group.category}</h3>
            <ul>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
        <div className="skills__group" data-motion="enter">
          <h3>{t("skills.languages")}</h3>
          <ul>
            {profile.languages.map((language) => (
              <li key={language.name}>
                {language.name}
                <span className="skills__level"> {language.level}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function ContactPanel() {
  return (
    <section className="panel contact" id="contact" aria-label={t("aria.contact")} data-show-mark>
      <p className="panel-label">{t("nav.contact")}</p>
      <div className="contact__body" data-motion="enter">
        <h2>{profile.identity.fullName}</h2>
        <p className="contact__location">{profile.identity.location}</p>
        <a className="contact__email" href={`mailto:${profile.identity.email}`}>
          {profile.identity.email}
        </a>
        <a className="contact__phone" href={phoneHref(profile.identity.phone)}>
          {profile.identity.phone}
        </a>
        <a
          className="contact__whatsapp"
          href={whatsappHref(profile.identity.phone)}
          target="_blank"
          rel="me noreferrer noopener"
        >
          {t("contact.whatsapp")}
        </a>
        <a className="contact__cv" href="/cv/CV_JOSOA_Yassini_Jacquerel.pdf" download="CV_JOSOA_Yassini_Jacquerel.pdf">
          {t("contact.cv")}
        </a>
        <ul className="contact__links">
          {profile.links.map((link) => (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="me noreferrer noopener">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
