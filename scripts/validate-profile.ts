import { readProfile } from "./profile-io.ts";

try {
  readProfile();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

console.log("profile.data.json valide");
