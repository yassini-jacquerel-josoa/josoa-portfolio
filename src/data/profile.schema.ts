// Schéma de src/data/profile.data.json — seule source du contenu.
// Un champ obligatoire manquant ou inconnu fait échouer le build.
// Ne pas ajouter de date de naissance, de numéro d'attestation
// ni de nom d'enseignant.

import { z, type ZodError } from "zod";

const requiredText = z
  .string({ error: "champ obligatoire" })
  .min(1, { error: "champ obligatoire" });

const yearMonth = z.string().regex(/^(?:TODO|\d{4}(?:-(?:0[1-9]|1[0-2]))?)$/, {
  error: "date AAAA, AAAA-MM ou TODO",
});

const urlOrTodo = z
  .string({ error: "champ obligatoire" })
  .refine((value) => value === "TODO" || z.url().safeParse(value).success, {
    error: "URL ou TODO attendu",
  });

const experienceSchema = z.strictObject({
  title: requiredText,
  organization: requiredText,
  employmentType: requiredText.optional(),
  location: requiredText,
  start: yearMonth,
  end: z.union([yearMonth, z.null()]),
  current: z.boolean({ error: "champ obligatoire" }),
  description: requiredText,
  skills: z.array(requiredText).min(1).optional(),
});

const projectSchema = z.strictObject({
  name: requiredText,
  role: requiredText,
  description: requiredText,
  stack: z.array(requiredText).min(1, { error: "stack obligatoire" }),
  url: urlOrTodo,
  status: z.enum(["en_cours", "termine"], {
    error: "statut en_cours ou termine obligatoire",
  }),
});

const educationSchema = z.strictObject({
  degree: requiredText,
  field: requiredText.optional(),
  school: requiredText,
  start: yearMonth,
  end: z.union([yearMonth, z.null()]),
  current: z.boolean({ error: "champ obligatoire" }),
  mention: requiredText.optional(),
  notes: requiredText.optional(),
});

export const profileSchema = z.strictObject({
  identity: z.strictObject({
    fullName: requiredText,
    brand: requiredText,
    markPrefix: requiredText,
    mark: requiredText,
    location: requiredText,
    email: z.email({ error: "email invalide" }),
    phone: requiredText,
  }),
  headline: requiredText,
  about: requiredText,
  experience: z.array(experienceSchema).min(1, { error: "au moins une expérience" }),
  projects: z.array(projectSchema).min(1, { error: "au moins un projet" }),
  education: z.array(educationSchema).min(1, { error: "au moins une formation" }),
  skills: z
    .array(
      z.strictObject({
        category: requiredText,
        items: z.array(requiredText).min(1, { error: "au moins une compétence" }),
      }),
    )
    .min(1, { error: "au moins une catégorie de compétences" }),
  languages: z
    .array(
      z.strictObject({
        name: requiredText,
        level: requiredText,
      }),
    )
    .min(1, { error: "au moins une langue" }),
  links: z
    .array(
      z.strictObject({
        label: requiredText,
        url: z.url({ error: "URL invalide" }),
      }),
    )
    .min(1, { error: "au moins un lien" }),
});

export type Profile = z.infer<typeof profileSchema>;
export type Experience = Profile["experience"][number];
export type Project = Profile["projects"][number];
export type Education = Profile["education"][number];

export function formatProfileIssues(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(racine)";
      return `- ${path} : ${issue.message}`;
    })
    .join("\n");
}
