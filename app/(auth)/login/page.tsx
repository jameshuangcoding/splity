"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Phase 1: login exists but no feature is gated behind it.
// Phase 2: add redirect-after-login and middleware enforcement.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sp-bg px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-sp-text">Sign in to Splity</h1>
          <p className="text-sm text-sp-text-dim">
            We&apos;ll send a magic link to your email.
          </p>
        </div>

        {sent ? (
          <p className="rounded-sp-md bg-sp-surface p-4 text-center text-sm text-sp-text-dim">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-sp-md bg-sp-surface-2 px-4 py-3 text-sp-text placeholder:text-sp-text-faint focus:outline-none focus:ring-2 focus:ring-sp-accent"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-sp-md bg-sp-accent py-3 text-[17px] font-bold text-white disabled:opacity-50"
              style={{ boxShadow: "var(--sp-accent-glow)" }}
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
