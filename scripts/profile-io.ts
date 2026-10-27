import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  formatProfileIssues,
  profileSchema,
  type Profile,
} from "../src/data/profile.schema.ts";

export const profileJsonPath = resolve("src/data/profile.data.json");

export function parseProfile(data: unknown): Profile {
  const result = profileSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`profile.data.json invalide :\n${formatProfileIssues(result.error)}`);
  }
  return result.data;
}

export function readProfileSource(): { text: string; data: unknown } {
  const text = readFileSync(profileJsonPath, "utf8");
  try {
    return { text, data: JSON.parse(text) as unknown };
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON illisible";
    throw new Error(`profile.data.json n'est pas du JSON valide : ${message}`);
  }
}

export function readProfile(): Profile {
  return parseProfile(readProfileSource().data);
}
