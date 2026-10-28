import fr from "./fr.json";

/** Langue affichée. Une autre locale se branche ici, avec les mêmes clés. */
export const locale = "fr" as const;

const catalogs = { fr };

export function t(path: string): string {
  const value = path.split(".").reduce<unknown>((node, key) => {
    if (node && typeof node === "object" && key in node) {
      return (node as Record<string, unknown>)[key];
    }
    return undefined;
  }, catalogs[locale]);

  if (typeof value !== "string") {
    throw new Error(`Clé i18n manquante : ${path}`);
  }
  return value;
}

export function monthName(index: number): string {
  const name = fr.months[index];
  if (!name) return "";
  return name;
}
