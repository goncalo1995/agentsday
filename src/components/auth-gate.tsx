"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Mail, ShieldCheck, Sparkles, LogOut, AlertTriangle } from "lucide-react";
import { db, INSTANT_APP_ID } from "@/lib/instant";

export function AuthGate({ children }: { children: ReactNode }) {
  const auth = db.useAuth();

  if (auth.isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6">
        <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!INSTANT_APP_ID) {
    return (
      <AuthShell>
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4 text-sm flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <div className="font-semibold">Instant app id is missing</div>
            <p className="text-muted mt-1">
              Add `NEXT_PUBLIC_INSTANT_APP_ID` to `.env`, then push `instant.schema.ts` and `instant.perms.ts`.
            </p>
          </div>
        </div>
      </AuthShell>
    );
  }

  if (auth.error) {
    return (
      <AuthShell>
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm">
          {auth.error.message}
        </div>
      </AuthShell>
    );
  }

  if (!auth.user) return <LoginPanel />;

  return (
    <>
      <div className="border-b border-border bg-surface-alt/50">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between text-xs text-muted">
          <span>Signed in as {auth.user.email ?? "creator"}</span>
          <button
            onClick={() => db.auth.signOut()}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-surface transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
      {children}
    </>
  );
}

function LoginPanel() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthCode = params.get("code");
    if (!oauthCode) return;

    setBusy(true);
    db.auth
      .exchangeOAuthCode({ code: oauthCode })
      .then(() => window.history.replaceState(null, "", window.location.pathname))
      .catch((err) => setError(err?.body?.message ?? err?.message ?? "Google sign-in failed."))
      .finally(() => setBusy(false));
  }, []);

  const googleUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return db.auth.createAuthorizationURL({
      clientName: "google-web",
      redirectURL: window.location.href, //window.location.origin + window.location.pathname,
      // extraFields: { createdAt: new Date().toISOString() },
    });
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!sent) {
        await db.auth.sendMagicCode({ email });
        setSent(true);
      } else {
        await db.auth.signInWithMagicCode({
          email,
          code,
          extraFields: { createdAt: new Date().toISOString() },
        });
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : "Sign-in failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted">Email</label>
          <div className="mt-1.5 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={sent}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-border bg-surface pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>

        {sent && (
          <div>
            <label className="text-xs font-semibold text-muted">Magic code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              inputMode="numeric"
              placeholder="123456"
              className="mt-1.5 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          disabled={busy}
          className="w-full rounded-2xl bg-accent px-4 py-3 font-semibold text-white hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Working..." : sent ? "Verify code" : "Send magic code"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-border" />
        or
        <div className="h-px flex-1 bg-border" />
      </div>

      <a
        href={googleUrl}
        className="flex items-center justify-center gap-2 rounded-2xl border border-border px-4 py-3 text-sm font-semibold hover:bg-surface-alt transition-colors"
      >
        <ShieldCheck className="w-4 h-4" />
        Continue with Google
      </a>
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[75vh] grid place-items-center px-6 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-accent text-white grid place-items-center shadow-lg shadow-accent/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">éFacil creator access</h1>
            <p className="text-sm text-muted mt-2">
              Sign in to save Viator deals, generate affiliate links, and track clicks.
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-xl shadow-black/5 space-y-5">
          {children}
        </div>
      </div>
    </div>
  );
}
