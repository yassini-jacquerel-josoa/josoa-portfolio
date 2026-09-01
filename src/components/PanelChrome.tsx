import FontMorph from "./FontMorph";

const navItems = [
  { label: "MOI", href: "#apropos" },
  { label: "PROJETS", href: "#projets" },
  { label: "VALEURS", href: "#valeurs" },
];

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
          text="JOSOA"
          fontAUrl="/fonts/Anton-Regular.ttf"
          fontBUrl="/fonts/PlayfairDisplay.ttf"
          fontSize={96}
          durationMs={700}
        />
      </header>

      {!isMark && (
        <nav className="nav" aria-label="Principal">
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
          <p className="footer__copy">FAIT AVEC SOIN À NOSY-BE ©2026</p>
        )}
        <div className="footer__mark">
          <span className="footer__is">jac.</span>
          <span className="footer__boring">YASSINI</span>
        </div>
      </div>
    </div>
  );
}
