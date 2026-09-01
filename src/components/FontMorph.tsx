// Morph chaque lettre de "JOSOA" entre deux polices, en interpolant
// les contours vectoriels (paths SVG) extraits via opentype.js.

import { useEffect, useMemo, useRef, useState } from "react";
import opentype from "opentype.js";
import flubber from "flubber";

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
  const animRef = useRef<number | null>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let cancelled = false;

    async function loadFonts() {
      setLoading(true);
      setFailed(false);

      const [fontA, fontB] = await Promise.all([
        loadFont(fontAUrl),
        loadFont(fontBUrl),
      ]);

      const unitsPerEm = fontA.unitsPerEm || 1000;
      const scale = fontSize / unitsPerEm;

      const result: LetterPaths[] = text.split("").map((char) => {
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

      if (!cancelled) {
        setLetters(result);
        setLoading(false);
      }
    }

    loadFonts().catch((err) => {
      console.error("Erreur de chargement des polices:", err);
      if (!cancelled) {
        setFailed(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [text, fontAUrl, fontBUrl, fontSize]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const svgWidth = useMemo(
    () => letters.reduce((sum, l) => sum + l.width, 0) + 24,
    [letters],
  );
  const svgHeight = fontSize * 1.35;

  function morphTo(target: number) {
    if (animRef.current) cancelAnimationFrame(animRef.current);
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
      }
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
      aria-label={`${text} — cliquer pour morpher la typographie`}
      style={{ cursor: failed ? "default" : "pointer", userSelect: "none" }}
    >
      {loading || failed || letters.length === 0 ? (
        <span className="font-morph__fallback">{text}</span>
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
                  key={`${letter.char}-${i}`}
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
