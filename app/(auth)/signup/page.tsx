import { redirect } from "next/navigation";

// Phase 1: signup redirects to login (magic-link covers both flows).
export default function SignupPage() {
  redirect("/login");
}
