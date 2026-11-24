// Morph chaque lettre de "JOSOA" entre deux polices, en interpolant
// les contours vectoriels (paths SVG) extraits via opentype.js.

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import opentype from "opentype.js";
import flubber from "flubber";
import { t } from "../i18n/index.ts";

const { interpolate } = flubber;

interface FontMorphProps {
  text?: string;
  fontAUrl: string;
  fontBUrl: string;
  fontSize?: number;
  durationMs?: number;
  className?: string;
}

interface LetterPaths {
  char: string;
  pathA: string;
  pathB: string;
  width: number;
  morph: ((t: number) => string) | null;
}

async function loadFont(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Police introuvable: ${url}`);
  const buffer = await res.arrayBuffer();
  return opentype.parse(buffer);
}

const glyphsCache = new Map<string, Promise<LetterPaths[]>>();

async function prepareGlyphs(text: string, fontAUrl: string, fontBUrl: string, fontSize: number) {
  const [fontA, fontB] = await Promise.all([
    loadFont(fontAUrl),
    loadFont(fontBUrl),
  ]);

  const unitsPerEm = fontA.unitsPerEm || 1000;
  const scale = fontSize / unitsPerEm;

  return Array.from(text, (char) => {
    const glyphA = fontA.charToGlyph(char);
    const glyphB = fontB.charToGlyph(char);

    const pathA = glyphA.getPath(0, 0, fontSize).toPathData(2);
    const pathB = glyphB.getPath(0, 0, fontSize).toPathData(2);

    let morph: ((t: number) => string) | null = null;
    if (pathA && pathB) {
      try {
        morph = interpolate(pathA, pathB, { maxSegmentLength: 4 });
      } catch {
        morph = null;
      }
    }

    const width =
      Math.max(glyphA.advanceWidth ?? 0, glyphB.advanceWidth ?? 0) * scale;

    return {
      char,
      pathA,
      pathB,
      width: Math.max(width, fontSize * 0.35),
      morph,
    };
  });
}

export default function FontMorph({
  text = "JOSOA",
  fontAUrl,
  fontBUrl,
  fontSize = 160,
  durationMs = 600,
  className,
}: FontMorphProps) {
  const [letters, setLetters] = useState<LetterPaths[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const logoRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  const targetRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setFailed(false);

    // Les deux marques partagent les mêmes contours et interpolateurs.
    const key = JSON.stringify([text, fontAUrl, fontBUrl, fontSize]);
    let glyphs = glyphsCache.get(key);
    if (!glyphs) {
      glyphs = prepareGlyphs(text, fontAUrl, fontBUrl, fontSize).catch((error) => {
        glyphsCache.delete(key);
        throw error;
      });
      glyphsCache.set(key, glyphs);
    }

    glyphs.then((result) => {
      if (cancelled) return;
      setLetters(result);
      setLoading(false);
    }).catch((error) => {
      if (cancelled) return;
      console.error("Erreur de chargement des polices:", error);
      setFailed(true);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [text, fontAUrl, fontBUrl, fontSize]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finish = () => {
      if (!reduced.matches || animRef.current === null) return;
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
      progressRef.current = targetRef.current;
      setProgress(targetRef.current);
    };
    reduced.addEventListener("change", finish);
    return () => {
      reduced.removeEventListener("change", finish);
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  useLayoutEffect(() => {
    // Les contours SVG peuvent remplacer le texte pendant le dévoilement.
    // Chaque lettre reprend alors le temps de la chorégraphie en cours.
    const logo = logoRef.current;
    const flight = logo?.parentElement?.getAnimations().find(
      (animation) =>
        animation instanceof CSSAnimation && animation.animationName === "hero-brand-flight",
    );
    if (typeof flight?.startTime !== "number") return;
    for (const animation of logo?.getAnimations({ subtree: true }) ?? []) {
      if (animation instanceof CSSAnimation && animation.animationName === "hero-glyph") {
        animation.startTime = flight.startTime;
      }
    }
  }, [letters]);

  const svgWidth = useMemo(
    () => letters.reduce((sum, l) => sum + l.width, 0) + 24,
    [letters],
  );
  const svgHeight = fontSize * 1.35;

  function morphTo(target: number) {
    targetRef.current = target;
    if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animRef.current = null;
      progressRef.current = target;
      setProgress(target);
      return;
    }
    const start = progressRef.current;
    const startTime = performance.now();

    function step(now: number) {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      const next = start + (target - start) * eased;
      progressRef.current = next;
      setProgress(next);
      if (t < 1) {
        animRef.current = requestAnimationFrame(step);
      } else animRef.current = null;
    }
    animRef.current = requestAnimationFrame(step);
  }

  function handleClick() {
    if (failed || letters.length === 0) return;
    morphTo(progressRef.current < 0.5 ? 1 : 0);
  }

  // Toujours le même wrapper : la taille vient uniquement du CSS (.brand__morph)
  return (
    <div
      ref={logoRef}
      className={className}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-busy={loading}
      aria-label={`${text} — ${t("aria.morph")}`}
      style={{ cursor: failed ? "default" : "pointer", userSelect: "none" }}
    >
      {loading || failed || letters.length === 0 ? (
        <span className="font-morph__fallback" aria-hidden="true">
          {Array.from(text, (char, index) => (
            <span
              className="font-morph__glyph"
              key={index}
              style={{ "--glyph-index": index } as CSSProperties}
            >
              {char}
            </span>
          ))}
        </span>
      ) : (
        <svg
          className="font-morph__svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="xMinYMid meet"
          width="100%"
          height="100%"
        >
          {(() => {
            let x = 8;
            return letters.map((letter, i) => {
              const d = letter.morph
                ? letter.morph(progress)
                : progress < 0.5
                  ? letter.pathA
                  : letter.pathB;

              const el = (
                <path
                  className="font-morph__glyph"
                  key={`${letter.char}-${i}`}
                  style={{ "--glyph-index": i } as CSSProperties}
                  d={d || letter.pathA}
                  transform={`translate(${x}, ${fontSize * 0.95})`}
                  fill="currentColor"
                />
              );
              x += letter.width;
              return el;
            });
          })()}
        </svg>
      )}
    </div>
  );
}
