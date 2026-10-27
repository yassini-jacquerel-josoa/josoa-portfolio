import type { Profile } from "../src/data/profile.schema.ts";

function firstSentence(text: string): string {
  const sentence = text
    .split(/(?<=\.)\s+/)
    .map((part) => part.trim())
    .find((part) => part.length > 0);
  return sentence ?? text.trim();
}

function metaDescription(about: string): string {
  const sentence = firstSentence(about);
  if (sentence.length <= 180) return sentence;
  return `${sentence.slice(0, 177).trimEnd()}…`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function personJsonLd(profile: Profile): Record<string, unknown> {
  const parts = profile.identity.location
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== "TODO");

  const address: Record<string, string> = { "@type": "PostalAddress" };
  if (parts[0]) address.addressLocality = parts[0];
  if (parts.length > 1) address.addressCountry = parts[parts.length - 1] ?? "";

  const schools = [...new Set(profile.education.map((item) => item.school))];
  const knowsAbout = profile.skills
    .flatMap((group) => group.items)
    .filter((item) => item !== "TODO");

  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.identity.fullName,
    jobTitle: profile.headline,
    email: profile.identity.email,
    telephone: profile.identity.phone,
    address,
    description: profile.about,
    sameAs: profile.links.map((link) => link.url),
    knowsLanguage: profile.languages.map((language) => language.name),
    knowsAbout,
    worksFor: profile.experience
      .filter((job) => job.current)
      .map((job) => ({ "@type": "Organization", name: job.organization })),
    alumniOf: schools.map((name) => ({
      "@type": "EducationalOrganization",
      name,
    })),
  };
}

export function renderSeoTags(profile: Profile): string {
  const title = `${profile.identity.fullName} — ${profile.headline}`;
  const description = metaDescription(profile.about);
  const jsonLd = JSON.stringify(personJsonLd(profile), null, 2).replaceAll("<", "\\u003c");

  return [
    `    <title>${escapeHtml(title)}</title>`,
    `    <meta name="description" content="${escapeHtml(description)}" />`,
    `    <meta name="author" content="${escapeHtml(profile.identity.fullName)}" />`,
    `    <meta property="og:title" content="${escapeHtml(title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(description)}" />`,
    `    <meta property="og:type" content="profile" />`,
    `    <meta property="og:locale" content="fr_FR" />`,
    `    <meta property="og:site_name" content="${escapeHtml(profile.identity.fullName)}" />`,
    `    <script type="application/ld+json">`,
    jsonLd
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n"),
    `    </script>`,
    "",
  ].join("\n");
}
