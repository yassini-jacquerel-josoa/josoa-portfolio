import { readProfile } from "./profile-io.ts";
import { renderSeoTags } from "./seo.ts";

try {
  process.stdout.write(renderSeoTags(readProfile()));
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
