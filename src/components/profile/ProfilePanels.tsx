import PanelChrome from "../PanelChrome.tsx";
import {
  cityOf,
  firstSentence,
  formatEducationPeriod,
  formatExperiencePeriod,
  headlineBits,
  lastSentence,
  orderedProjects,
  phoneHref,
  profile,
  projectStatusLabel,
} from "../../data/profile.ts";
import { fallbackVisual, projectVisuals } from "../../data/visuals.ts";

const PROJECT_TONES = ["tone-0", "tone-1", "tone-2"] as const;
const HIGHLIGHT_ROWS = ["one", "two", "three"] as const;

function placeLabel(location: string): string {
  return location === "TODO" ? "Lieu : TODO" : location;
}

export function HeroPanel({ shrunk }: { shrunk: boolean }) {
  const bits = headlineBits(profile.headline);

  return (
    <section
      className={`panel hero${shrunk ? " hero--shrunk" : ""}`}
      aria-label="Accueil"
    >
      <PanelChrome variant="hero" />
      <a className="home-link" href="#top">
        Bienvenue
      </a>

      <div className="hero__inner" data-scroll-y>
        <h1 className="hero__title">
          <span className="hero__line hero__line--a">{bits.lineA}</span>
          <span className="hero__line hero__line--b">{bits.lineB}</span>
          <span className="hero__line hero__line--c">
            {bits.prefix ? <span className="hero__lo">{bits.prefix}</span> : null}
            <span className="hero__ordinario">{bits.accent}</span>
          </span>
        </h1>

        <p className="hero__copy">
          {profile.identity.fullName}
          <br />
          {profile.identity.location}
          {bits.stack ? (
            <>
              <br />
              {bits.stack}
            </>
          ) : null}
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
      aria-label="À propos"
      data-show-mark
    >
      <div className="about__box">
        <p className="about__label">Moi</p>
        <div className="about__content">
          <h2 className="about__title">
            {bits.aboutLines.map((line, index) => (
              <span className={`about__line about__line--${index + 1}`} key={`${line}-${index}`}>
                {line}
              </span>
            ))}
          </h2>
          <p className="about__text" data-scroll-y data-motion="enter">
            {profile.about}
          </p>
        </div>
      </div>
    </section>
  );
}

export function PullQuotePanel() {
  return (
    <section className="panel values" data-show-mark aria-label="Profil">
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
      aria-label="Expérience"
      data-show-mark
    >
      <p className="panel-label">Parcours</p>
      {profile.experience.map((job) => (
        <article
          className="record-card"
          data-scroll-y
          data-motion="enter"
          key={`${job.organization}-${job.title}`}
        >
          {job.current ? <span className="badge">Poste actuel</span> : null}
          <p className="record-card__period">{formatExperiencePeriod(job)}</p>
          <h3>{job.title}</h3>
          <p className="record-card__org">{job.organization}</p>
          <p className="record-card__meta">
            {[job.employmentType, placeLabel(job.location)].filter(Boolean).join(" · ")}
          </p>
          <p className="record-card__text">{job.description}</p>
          {job.skills && job.skills.length > 0 ? (
            <>
              <p className="record-card__kicker">Compétences</p>
              <p className="record-card__skills">{job.skills.join(" · ")}</p>
            </>
          ) : null}
        </article>
      ))}
    </section>
  );
}

export function ProjectsPanel() {
  const projects = orderedProjects(profile.projects);

  return (
    <section
      className="panel projects-showcase"
      id="projets"
      aria-label="Projets"
      data-show-mark
    >
      <p className="panel-label">Projets</p>
      {projects.map((project, index) => {
        const image = projectVisuals[project.name] ?? fallbackVisual;
        const tone = PROJECT_TONES[index % PROJECT_TONES.length];
        const current = project.status === "en_cours";
        return (
          <article
            className={`project-card project-card--${tone}${current ? " project-card--current" : ""}`}
            key={project.name}
          >
            <div className="project-card__media">
              <img src={image.src} alt={image.alt} />
            </div>
            {current ? <span className="badge">En cours</span> : null}
            <div className="project-card__body" data-scroll-y data-motion="enter">
              <div className="project-card__meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <span>{projectStatusLabel[project.status]}</span>
              </div>
              <h3>{project.name}</h3>
              <p className="project-card__role">
                {project.role === "TODO" ? "Rôle : TODO" : project.role}
              </p>
              <p className="project-card__text">{project.description}</p>
              <p className="project-card__stack">
                {project.stack.length === 1 && project.stack[0] === "TODO"
                  ? "Stack : TODO"
                  : project.stack.join(" · ")}
              </p>
              {project.url === "TODO" ? (
                <p className="project-card__url">Lien : TODO</p>
              ) : (
                <a
                  className="project-card__url"
                  href={project.url}
                  target="_blank"
                  rel="me noreferrer noopener"
                >
                  {project.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function EducationPanel() {
  return (
    <section
      className="panel record-row"
      id="formation"
      aria-label="Formation"
      data-show-mark
    >
      <p className="panel-label">Formation</p>
      {profile.education.map((item) => (
        <article
          className="record-card"
          data-scroll-y
          data-motion="enter"
          key={`${item.school}-${item.degree}`}
        >
          {item.current ? <span className="badge">En cours</span> : null}
          <p className="record-card__period">{formatEducationPeriod(item)}</p>
          <h3>{item.degree}</h3>
          {item.field ? <p className="record-card__org">{item.field}</p> : null}
          <p className="record-card__meta">{item.school}</p>
          {item.mention ? <p className="record-card__text">Mention {item.mention}</p> : null}
          {item.notes ? <p className="record-card__text">{item.notes}</p> : null}
        </article>
      ))}
    </section>
  );
}

export function SkillsHighlightPanel() {
  const group =
    profile.skills.find((item) => item.category === "Principales") ?? profile.skills[0];
  if (!group) return null;

  return (
    <section className="panel principles" data-show-mark aria-label={group.category}>
      {group.items.slice(0, 3).map((skill, index) => (
        <div
          className={`principles__row principles__row--${HIGHLIGHT_ROWS[index] ?? "one"}`}
          key={skill}
        >
          <span className="principles__index">0{index + 1}</span>
          <h2>{skill.toLocaleUpperCase("fr-FR")}</h2>
        </div>
      ))}
      <p className="principles__copy" data-motion="enter">
        {profile.headline}
      </p>
    </section>
  );
}

export function SkillsPanel() {
  return (
    <section
      className="panel skills"
      id="competences"
      aria-label="Compétences"
      data-show-mark
    >
      <p className="panel-label">Compétences</p>
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
        <h3>Langues</h3>
        <ul>
          {profile.languages.map((language) => (
            <li key={language.name}>
              {language.name}
              <span className="skills__level"> {language.level}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function ContactPanel() {
  return (
    <section className="panel contact" id="contact" aria-label="Contact" data-show-mark>
      <p className="panel-label">Contact</p>
      <div className="contact__body" data-motion="enter">
        <h2>{profile.identity.fullName}</h2>
        <p className="contact__location">{profile.identity.location}</p>
        <a className="contact__email" href={`mailto:${profile.identity.email}`}>
          {profile.identity.email}
        </a>
        <a className="contact__phone" href={phoneHref(profile.identity.phone)}>
          {profile.identity.phone}
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
