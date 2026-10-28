import { profile } from "../data/profile.ts";
import { t } from "../i18n/index.ts";
import FontMorph from "./FontMorph";

const navItems = [
  { label: t("nav.about"), href: "#apropos" },
  { label: t("nav.experience"), href: "#experience" },
  { label: t("nav.projects"), href: "#projets" },
  { label: t("nav.education"), href: "#formation" },
  { label: t("nav.skills"), href: "#competences" },
  { label: t("nav.contact"), href: "#contact" },
];

const year = new Date().getFullYear();

type PanelChromeProps = {
  /** hero = brand + menu + footer complet ; mark = JOSOA + jac. YASSINI seulement */
  variant?: "hero" | "mark";
  className?: string;
  visible?: boolean;
};

export default function PanelChrome({
  variant = "hero",
  className = "",
  visible = true,
}: PanelChromeProps) {
  const isMark = variant === "mark";

  return (
    <div
      className={`panel-chrome panel-chrome--${variant}${visible ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden={isMark ? !visible : undefined}
    >
      <header className="brand">
        <FontMorph
          className="brand__morph"
          text={profile.identity.brand}
          fontAUrl="/fonts/Anton-Regular.ttf"
          fontBUrl="/fonts/PlayfairDisplay.ttf"
          fontSize={96}
          durationMs={700}
        />
      </header>

      {!isMark && (
        <nav className="nav" aria-label={t("aria.nav")}>
          <ul>
            {navItems.map((item) => (
              <li key={item.label}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className={`footer${isMark ? " footer--mark-only" : ""}`}>
        {!isMark && (
          <p className="footer__copy">
            {profile.identity.location.toLocaleUpperCase("fr-FR")} ©{year}
          </p>
        )}
        <div className="footer__mark">
          <span className="footer__is">{profile.identity.markPrefix}</span>
          <span className="footer__boring">{profile.identity.mark}</span>
        </div>
      </div>
    </div>
  );
}
