import { monthName, t } from "../i18n/index.ts";
import profileData from "./profile.data.json" with { type: "json" };
import {
  formatProfileIssues,
  profileSchema,
  type Education,
  type Experience,
  type Profile,
  type Project,
} from "./profile.schema.ts";

const parsed = profileSchema.safeParse(profileData);

if (!parsed.success) {
  throw new Error(`profile.data.json invalide :\n${formatProfileIssues(parsed.error)}`);
}

export const profile: Profile = parsed.data;

export type { Education, Experience, Profile, Project };

export function projectStatusLabel(status: Project["status"]): string {
  return t(`projectStatus.${status}`);
}

export function sentences(text: string): string[] {
  return text
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function firstSentence(text: string): string {
  return sentences(text)[0] ?? text.trim();
}

export function lastSentence(text: string): string {
  const parts = sentences(text);
  return parts[parts.length - 1] ?? text.trim();
}

export function headlineBits(headline: string): {
  lineA: string;
  lineB: string;
  prefix: string;
  accent: string;
  stack: string;
  aboutLines: string[];
} {
  const parts = headline
    .split("|")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const role = parts[0] ?? "";
  const stack = parts[1] ?? "";
  const focus = parts[2] ?? parts[parts.length - 1] ?? "";
  const roleWords = role.split(/\s+/).filter(Boolean);
  const lineA = roleWords[0] ?? role;
  const lineB = roleWords.slice(1).join(" ") || lineA;
  const focusWords = focus.split(/\s+/).filter(Boolean);
  const accent = focusWords.at(-1) ?? focus;
  const prefix = focusWords.slice(0, -1).join(" ");
  const firstTech = stack.split("·").map((part) => part.trim()).filter(Boolean)[0] ?? stack;
  return {
    lineA,
    lineB,
    prefix,
    accent,
    stack,
    aboutLines: [lineA, lineB, firstTech, focus],
  };
}

export function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const month = monthName(Number(match[2]) - 1);
  return month ? `${month} ${match[1]}` : value;
}

function formatRange(start: string, end: string | null): string {
  const startLabel = formatDate(start);
  if (!end) return startLabel;
  const endLabel = formatDate(end);
  if (startLabel === endLabel) return startLabel;
  return `${startLabel} – ${endLabel}`;
}

export function formatExperiencePeriod(item: Pick<Experience, "start" | "end" | "current">): string {
  if (item.current) {
    return `${t("period.since")} ${formatDate(item.start)} · ${t("period.currentRole")}`;
  }
  return formatRange(item.start, item.end);
}

export function formatEducationPeriod(item: Pick<Education, "start" | "end" | "current">): string {
  if (item.current) {
    return `${t("period.since")} ${formatDate(item.start)} · ${t("period.ongoing")}`;
  }
  return formatRange(item.start, item.end);
}

export function phoneHref(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, "");
  return `tel:${compact || phone}`;
}

export function whatsappHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function cityOf(location: string): string {
  const [city] = location.split(",");
  return city?.trim() || location;
}

export function orderedProjects<T extends { status: Project["status"] }>(items: readonly T[]): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const rank = (status: T["status"]) => (status === "en_cours" ? 0 : 1);
      const byStatus = rank(left.item.status) - rank(right.item.status);
      return byStatus === 0 ? left.index - right.index : byStatus;
    })
    .map(({ item }) => item);
}

export function metaDescription(about: string): string {
  const sentence = firstSentence(about);
  if (sentence.length <= 180) return sentence;
  return `${sentence.slice(0, 177).trimEnd()}…`;
}
