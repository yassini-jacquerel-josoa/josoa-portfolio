// Fusionne un export LinkedIn officiel dans src/data/profile.data.json.
//
// Ne réécrit jamais :
// - about
// - la description d'une expérience déjà rédigée (autre que TODO)
// - name, role, description, stack, status d'un projet existant
// - notes et mention d'une formation déjà renseignées
//
// Le headline est mis à jour depuis Profile.csv.
// Les dates, lieux et URL encore marqués TODO sont complétés quand l'export
// contient une valeur concrète. Une entrée nouvelle incomplète n'est pas ajoutée.
// La date de naissance et l'adresse postale ne sont jamais écrites.

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";
import { parseCsv, pick, type CsvRow } from "./csv.ts";
import { parseProfile, profileJsonPath, readProfileSource } from "./profile-io.ts";
import type { Education, Experience, Profile, Project } from "../src/data/profile.schema.ts";

const EXPECTED = ["Profile.csv", "Positions.csv", "Education.csv", "Skills.csv", "Projects.csv"];

const MONTHS: Record<string, string> = {
  jan: "01",
  january: "01",
  janvier: "01",
  feb: "02",
  february: "02",
  fevrier: "02",
  fevr: "02",
  mar: "03",
  march: "03",
  mars: "03",
  apr: "04",
  april: "04",
  avril: "04",
  avr: "04",
  may: "05",
  mai: "05",
  jun: "06",
  june: "06",
  juin: "06",
  jul: "07",
  july: "07",
  juillet: "07",
  juil: "07",
  aug: "08",
  august: "08",
  aout: "08",
  sep: "09",
  sept: "09",
  september: "09",
  septembre: "09",
  oct: "10",
  october: "10",
  octobre: "10",
  nov: "11",
  november: "11",
  novembre: "11",
  dec: "12",
  december: "12",
  decembre: "12",
};

function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\./g, "")
    .trim();
}

function keyOf(value: string): string {
  return fold(value).replace(/[^a-z0-9]+/g, "");
}

function isTodo(value: string): boolean {
  return value.trim() === "" || value.trim() === "TODO";
}

function parseLinkedInDate(value: string): string | null {
  const raw = value.trim();
  if (!raw || /^present$/i.test(raw) || /^aujourd/i.test(raw)) return null;
  const iso = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(raw);
  if (iso) return `${iso[1]}-${iso[2]}`;
  if (/^\d{4}$/.test(raw)) return raw;
  const monthYear = /^([A-Za-zÀ-ÿ.]+)\s+(\d{4})$/.exec(raw);
  if (!monthYear) return null;
  const month = MONTHS[fold(monthYear[1] ?? "")];
  return month ? `${monthYear[2]}-${month}` : null;
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim().replace(/[.,)]+$/, "");
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return z.url().safeParse(withProtocol).success ? withProtocol : null;
}

function canonUrl(url: string): string {
  return url.trim().replace(/\/$/, "").toLowerCase();
}

function resolveCsv(dir: string, name: string): string {
  const expected = resolve(dir, name);
  if (existsSync(expected)) return expected;
  const found = readdirSync(dir).find((file) => file.toLowerCase() === name.toLowerCase());
  if (!found) throw new Error(`Fichier manquant : ${name}`);
  return resolve(dir, found);
}

function readExport(dir: string): Record<string, CsvRow[]> {
  if (!existsSync(dir)) {
    throw new Error(
      `Export LinkedIn introuvable : ${dir}\nFichiers attendus : ${EXPECTED.join(", ")}`,
    );
  }
  const tables: Record<string, CsvRow[]> = {};
  for (const name of EXPECTED) {
    tables[name] = parseCsv(readFileSync(resolveCsv(dir, name), "utf8"));
  }
  return tables;
}

function findExperience(list: Experience[], organization: string, title: string): Experience | undefined {
  const wanted = `${keyOf(organization)}|${keyOf(title)}`;
  return list.find((item) => `${keyOf(item.organization)}|${keyOf(item.title)}` === wanted);
}

function findEducation(list: Education[], school: string, degree: string): Education | undefined {
  const exact = list.find(
    (item) => keyOf(item.school) === keyOf(school) && keyOf(item.degree) === keyOf(degree),
  );
  if (exact) return exact;
  const matches = list.filter((item) => {
    const schoolOk =
      keyOf(item.school) === keyOf(school) ||
      keyOf(school).startsWith(keyOf(item.school)) ||
      keyOf(item.school).startsWith(keyOf(school));
    const degreeKey = keyOf(`${item.degree} ${item.field ?? ""}`);
    const degreeOk =
      keyOf(item.degree) === keyOf(degree) ||
      degreeKey === keyOf(degree) ||
      keyOf(degree) === degreeKey;
    return schoolOk && degreeOk;
  });
  return matches.length === 1 ? matches[0] : undefined;
}

function findProject(list: Project[], name: string): Project | undefined {
  return list.find((item) => keyOf(item.name) === keyOf(name));
}

function skillExists(profile: Profile, name: string): boolean {
  const wanted = keyOf(name);
  return profile.skills.some((group) => group.items.some((item) => keyOf(item) === wanted));
}

function merge(profile: Profile, tables: Record<string, CsvRow[]>): string[] {
  const changes: string[] = [];
  const conserved = new Set<string>();

  const profileRow = tables["Profile.csv"]?.[0];
  if (profileRow) {
    const headline = pick(profileRow, ["Headline"]);
    const summary = pick(profileRow, ["Summary"]);
    const geo = pick(profileRow, ["Geo Location"]);
    const websites = pick(profileRow, ["Websites"]);

    if (headline && headline !== profile.headline) {
      changes.push(`headline : « ${profile.headline} » → « ${headline} »`);
      profile.headline = headline;
    }

    if (summary && summary !== profile.about) conserved.add("about");

    if (geo && isTodo(profile.identity.location)) {
      profile.identity.location = geo;
      changes.push(`identité : lieu « ${geo} »`);
    } else if (geo && fold(geo) !== fold(profile.identity.location)) {
      conserved.add("localisation");
    }

    const first = pick(profileRow, ["First Name"]);
    const last = pick(profileRow, ["Last Name"]);
    const exportedName = [first, last].filter(Boolean).join(" ");
    if (exportedName && fold(exportedName) !== fold(profile.identity.fullName)) {
      conserved.add("nom");
    }

    for (const site of extractWebsites(websites)) {
      const known = profile.links.some((link) => canonUrl(link.url) === canonUrl(site.url));
      if (known) continue;
      profile.links.push(site);
      changes.push(`lien ajouté : ${site.label} (${site.url})`);
    }
  }

  for (const row of tables["Positions.csv"] ?? []) {
    const organization = pick(row, ["Company Name", "Company"]);
    const title = pick(row, ["Title"]);
    if (!organization && !title) continue;

    const description = pick(row, ["Description"]);
    const location = pick(row, ["Location"]);
    const startRaw = pick(row, ["Started On", "Start Date"]);
    const endRaw = pick(row, ["Finished On", "End Date"]);
    const start = parseLinkedInDate(startRaw);
    const end = parseLinkedInDate(endRaw);
    const existing = findExperience(profile.experience, organization, title);

    if (!existing) {
      const ongoing = endRaw.trim() === "" && start !== null;
      if (!title || !organization || !location || !start || !description || (!ongoing && !end)) {
        changes.push(
          `expérience non ajoutée (données incomplètes) : ${title || "sans titre"} — ${organization || "sans organisation"}`,
        );
        continue;
      }
      const entry: Experience = {
        title,
        organization,
        location,
        start,
        end: ongoing ? null : end,
        current: ongoing,
        description,
      };
      if (entry.current) profile.experience.unshift(entry);
      else profile.experience.push(entry);
      changes.push(`expérience ajoutée : ${entry.title} — ${entry.organization}`);
      continue;
    }

    if (description && !isTodo(existing.description) && description !== existing.description) {
      conserved.add(`description « ${existing.organization} »`);
    } else if (description && isTodo(existing.description)) {
      existing.description = description;
      changes.push(`expérience « ${existing.organization} » : description complétée`);
    }

    if (location && isTodo(existing.location)) {
      existing.location = location;
      changes.push(`expérience « ${existing.organization} » : lieu « ${location} »`);
    }

    if (start && isTodo(existing.start)) {
      existing.start = start;
      changes.push(`expérience « ${existing.organization} » : début ${start}`);
    }

    if (typeof existing.end === "string" && isTodo(existing.end)) {
      if (end) {
        existing.end = end;
        existing.current = false;
        changes.push(`expérience « ${existing.organization} » : fin ${end}`);
      } else if (endRaw.trim() === "") {
        changes.push(
          `expérience « ${existing.organization} » : l'export n'a pas de date de fin`,
        );
      }
    }
  }

  for (const row of tables["Education.csv"] ?? []) {
    const school = pick(row, ["School Name", "School"]);
    const degree = pick(row, ["Degree Name", "Degree"]);
    if (!school && !degree) continue;

    const notes = pick(row, ["Notes", "Activities"]);
    const startRaw = pick(row, ["Start Date", "Started On"]);
    const endRaw = pick(row, ["End Date", "Finished On"]);
    const start = parseLinkedInDate(startRaw);
    const end = parseLinkedInDate(endRaw);
    const existing = findEducation(profile.education, school, degree);

    if (!existing) {
      const ongoing = endRaw.trim() === "" && start !== null;
      if (!degree || !school || !start || (!ongoing && !end)) {
        changes.push(
          `formation non ajoutée (données incomplètes) : ${degree || "sans diplôme"} — ${school || "sans école"}`,
        );
        continue;
      }
      const entry: Education = {
        degree,
        school,
        start,
        end: ongoing ? null : end,
        current: ongoing,
      };
      if (notes) entry.notes = notes;
      if (entry.current) profile.education.unshift(entry);
      else profile.education.push(entry);
      changes.push(`formation ajoutée : ${entry.degree} — ${entry.school}`);
      continue;
    }

    if (notes && existing.notes && !isTodo(existing.notes) && notes !== existing.notes) {
      conserved.add(`notes « ${existing.degree} »`);
    } else if (notes && (!existing.notes || isTodo(existing.notes))) {
      existing.notes = notes;
      changes.push(`formation « ${existing.degree} » : notes complétées`);
    }

    if (start && isTodo(existing.start)) {
      existing.start = start;
      changes.push(`formation « ${existing.degree} » : début ${start}`);
    }

    if (existing.end !== null && isTodo(existing.end) && end) {
      existing.end = end;
      existing.current = false;
      changes.push(`formation « ${existing.degree} » : fin ${end}`);
    }
  }

  for (const row of tables["Skills.csv"] ?? []) {
    const name = pick(row, ["Name", "Skill"]);
    if (!name || skillExists(profile, name)) continue;
    let bucket = profile.skills.find((group) => group.category === "LinkedIn");
    if (!bucket) {
      bucket = { category: "LinkedIn", items: [] };
      profile.skills.push(bucket);
    }
    bucket.items.push(name);
    changes.push(`compétence ajoutée : ${name}`);
  }

  for (const row of tables["Projects.csv"] ?? []) {
    const name = pick(row, ["Title", "Name"]);
    if (!name) continue;
    const description = pick(row, ["Description"]);
    const url = normalizeUrl(pick(row, ["Url", "URL", "Project Url"]));
    const existing = findProject(profile.projects, name);

    if (!existing) {
      changes.push(
        `projet « ${name} » non ajouté : le rôle et la stack se rédigent dans profile.data.json`,
      );
      continue;
    }

    if (description && isTodo(existing.description)) {
      existing.description = description;
      changes.push(`projet « ${existing.name} » : description complétée`);
    } else if (description && description !== existing.description) {
      conserved.add(`projet « ${existing.name} »`);
    }
    if (url && !existing.links.some((link) => canonUrl(link.url) === canonUrl(url))) {
      conserved.add(`lien « ${existing.name} »`);
    }
  }

  if (conserved.size > 0) {
    changes.push(`Textes personnalisés conservés : ${[...conserved].join(", ")}`);
  }

  return changes;
}

function extractWebsites(value: string): { label: string; url: string }[] {
  if (!value.trim()) return [];
  const found: { label: string; url: string }[] = [];
  const chunks = value.split(/\s*,\s*|\n+/);
  for (const chunk of chunks) {
    const match = chunk.match(/https?:\/\/[^\s,]+/i);
    if (!match) continue;
    const [urlPart, labelPart] = (match[0] ?? "").split("::");
    const url = normalizeUrl(urlPart ?? "");
    if (!url) continue;
    let label = labelPart?.trim() ?? "";
    if (!label) {
      try {
        label = new URL(url).hostname.replace(/^www\./, "");
      } catch {
        label = url;
      }
    }
    found.push({ label, url });
  }
  return found;
}

function main(): void {
  const dir = process.argv[2] ? resolve(process.argv[2]) : resolve("data/linkedin-export");
  const tables = readExport(dir);
  const source = readProfileSource();
  const profile = parseProfile(source.data);
  const before = JSON.stringify(profile);
  const changes = merge(profile, tables);
  parseProfile(profile);

  if (JSON.stringify(profile) === before) {
    console.log("Aucune modification. Les textes personnalisés sont inchangés.");
    for (const change of changes) console.log(`- ${change}`);
    return;
  }

  const next = `${JSON.stringify(profile, null, 2)}\n`;

  writeFileSync(profileJsonPath, next);
  console.log(`Profil mis à jour : ${profileJsonPath}`);
  if (changes.length === 0) console.log("- formatage JSON uniquement");
  for (const change of changes) console.log(`- ${change}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
