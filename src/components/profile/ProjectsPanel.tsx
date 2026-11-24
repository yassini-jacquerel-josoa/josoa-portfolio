import { useRef, useState, type CSSProperties } from "react";
import { createPortal, flushSync } from "react-dom";
import { useProjectsMotion } from "../../animations/useProjectsMotion.ts";
import { orderedProjects, profile, projectStatusLabel } from "../../data/profile.ts";
import type { Project } from "../../data/profile.schema.ts";
import { fallbackVisual, projectVisuals } from "../../data/visuals.ts";
import { t } from "../../i18n/index.ts";

const projects = orderedProjects(profile.projects);
const PROJECT_TONES = ["sand", "slate", "blue"] as const;
const detailsId = "project-details";

function ProjectTitle({ name }: { name: string }) {
  let letterIndex = 0;

  return (
    <h3 className="project-card__title" aria-label={name}>
      <span aria-hidden="true">
        {name.split(" ").map((word, wordIndex) => (
          <span key={wordIndex}>
            {wordIndex > 0 && " "}
            <span className="project-card__word">
              {Array.from(word, (letter, index) => (
                <span
                  className="project-card__letter"
                  key={index}
                  style={{ "--project-letter-delay": Math.min(letterIndex++ * 0.009, 0.16) } as CSSProperties}
                >
                  {letter}
                </span>
              ))}
            </span>
          </span>
        ))}
      </span>
    </h3>
  );
}

export default function ProjectsPanel({
  scrollToProject,
}: { scrollToProject?: (left: number) => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  useProjectsMotion(sectionRef, scrollToProject);

  return (
    <section
      className="panel projects-showcase"
      id="projets"
      aria-labelledby="projects-title"
      ref={sectionRef}
    >
      <div className="projects-showcase__intro" data-show-mark>
        <h2 id="projects-title">{t("nav.projects")}</h2>
        <p className="projects-showcase__intro-hint">{t("projects.selectionsHint")}</p>
      </div>

      {projects.map((project, index) => {
        const image = projectVisuals[project.name] ?? fallbackVisual;
        const tone = PROJECT_TONES[index % PROJECT_TONES.length];
        return (
          <div className="project-card-slot" key={project.name} data-show-mark>
            <article className={`project-card project-card--${tone}`}>
              <div className="project-card__media">
                <img
                  src={image.src}
                  alt={image.alt}
                  className={image.fit === "contain" ? "project-card__img--contain" : undefined}
                />
              </div>
              <div className="project-card__caption">
                <div className="project-card__meta">
                  <span>{project.role}</span>
                  <span>{projectStatusLabel(project.status)}</span>
                </div>
                <ProjectTitle name={project.name} />
                <div className="project-card__footer">
                  <span className="project-card__number" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <button
                    className="project-card__button"
                    type="button"
                    aria-label={`${t("projects.view")} ${project.name}`}
                    aria-haspopup="dialog"
                    aria-controls={detailsId}
                    onClick={(event) => {
                      event.currentTarget.focus({ preventScroll: true });
                      flushSync(() => setSelectedProject(project));
                      dialogRef.current?.showModal();
                    }}
                  >
                    {t("projects.view")}
                  </button>
                </div>
              </div>
            </article>
          </div>
        );
      })}

      {createPortal(
        <dialog
          className="project-details"
          id={detailsId}
          ref={dialogRef}
          aria-labelledby="project-details-title"
        >
          <form method="dialog" className="project-details__actions">
            <button className="project-details__pill" autoFocus>{t("projects.close")}</button>
          </form>
          {selectedProject && (
            <>
              <p className="project-details__status">{projectStatusLabel(selectedProject.status)}</p>
              <h2 id="project-details-title">{selectedProject.name}</h2>
              <p className="project-details__role">{selectedProject.role}</p>
              <p className="project-details__description">{selectedProject.description}</p>
              {selectedProject.stack.length > 0 && (
                <p className="project-details__stack">{selectedProject.stack.join(" · ")}</p>
              )}
              {selectedProject.links.length > 0 && (
                <div className="project-details__links">
                  {selectedProject.links.map((link) => (
                    <a
                      className="project-details__pill"
                      href={link.url}
                      key={link.url}
                      target="_blank"
                      rel="me noreferrer noopener"
                    >
                      {link.label}<span aria-hidden="true">↗</span>
                    </a>
                  ))}
                </div>
              )}
            </>
          )}
        </dialog>,
        document.body,
      )}
    </section>
  );
}
