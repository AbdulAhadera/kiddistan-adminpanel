"use client";

import Image from "next/image";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setIsError(true);
      setMessage("Enter your email address and password.");
      return;
    }

    setIsSubmitting(true);
    setIsError(false);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setIsError(true);
      setMessage("Incorrect email address or password.");
      setIsSubmitting(false);
      return;
    }

    const nextPath = searchParams.get("next");

    const safeNextPath =
      nextPath && nextPath.startsWith("/admin")
        ? nextPath
        : "/admin/dashboard";

    router.replace(safeNextPath);
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-[#102a43] lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_5%_5%,rgba(53,170,255,0.45),transparent_33%),radial-gradient(circle_at_85%_85%,rgba(255,180,65,0.22),transparent_36%)]" />

          <div className="absolute -left-20 bottom-16 h-72 w-72 rounded-full border border-white/10 bg-white/5" />
          <div className="absolute right-10 top-32 h-44 w-44 rounded-full border border-white/10 bg-white/5" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-sm border border-white/15 bg-white/10 p-1">
              <Image
                src="/pfp.webp"
                alt="Kiddistan"
                width={48}
                height={48}
                priority
                className="h-full w-full rounded-lg object-cover"
              />
            </div>

            <div>
              <Image
                src="/kiddistan-logo.png"
                alt="Kiddistan"
                width={170}
                height={52}
                priority
                className="h-8 w-auto object-contain object-left brightness-0 invert"
              />

              <p className="mt-1 text-xs font-medium tracking-wide text-white/60">
                ADMINISTRATION CONSOLE
              </p>
            </div>
          </div>

          <div className="relative max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-sky-300" />
              Secure staff workspace
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.12] tracking-tight text-white xl:text-5xl">
              Everything your Kiddistan store needs, in one place.
            </h1>

            <p className="mt-5 max-w-md text-base leading-7 text-white/70">
              Manage products, inventory, collections, customer orders, and
              store performance with confidence.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-sm border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <PackageIcon />

                <p className="mt-3 text-sm font-semibold text-white">
                  Product control
                </p>

                <p className="mt-1 text-xs leading-5 text-white/60">
                  Catalog, photos, sizes, stock, and pricing.
                </p>
              </div>

              <div className="rounded-sm border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 text-amber-300" />

                <p className="mt-3 text-sm font-semibold text-white">
                  Store insights
                </p>

                <p className="mt-1 text-xs leading-5 text-white/60">
                  Orders, customer activity, and analytics.
                </p>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-between text-xs text-white/45">
            <span>© {new Date().getFullYear()} Kiddistan</span>

            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Internal access only
            </span>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-5 py-10 sm:px-8">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/[0.06] to-transparent lg:hidden" />

          <div className="relative w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-border bg-card p-1 shadow-sm">
                <Image
                  src="/pfp.jpg"
                  alt="Kiddistan"
                  width={44}
                  height={44}
                  priority
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>

              <div>
                <Image
                  src="/kiddistan-logo.png"
                  alt="Kiddistan"
                  width={150}
                  height={48}
                  priority
                  className="h-8 w-auto object-contain object-left"
                />

                <p className="mt-0.5 text-[10px] font-semibold tracking-[0.15em] text-muted-foreground">
                  ADMIN CONSOLE
                </p>
              </div>
            </div>

            <div className="card-surface overflow-hidden border border-border/80 shadow-panel">
              <div className="border-b border-border bg-muted/25 px-6 py-5 sm:px-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                      Admin Console
                    </p>

                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      Welcome back
                    </h2>

                    <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                      Sign in with your authorized admin account.
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Lock className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 px-6 py-6 sm:px-7 sm:py-7"
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>

                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="admin@kiddistan.com"
                      className="h-11 pl-9"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="password">Password</Label>

                    <span className="text-xs text-muted-foreground">
                      Secure sign-in
                    </span>
                  </div>

                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      className="h-11 pl-9 pr-10"
                      disabled={isSubmitting}
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      disabled={isSubmitting}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {message ? (
                  <div
                    role="alert"
                    className={
                      isError
                        ? "rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
                        : "rounded-lg border border-success/25 bg-success/10 px-3 py-2.5 text-sm text-success"
                    }
                  >
                    {message}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="h-11 w-full"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {!isSubmitting ? <LogIn className="h-4 w-4" /> : null}
                  {isSubmitting ? "Signing in..." : "Sign in to Admin"}
                </Button>

                <div className="flex items-center justify-center gap-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Protected with secure authentication
                </div>
              </form>
            </div>

            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              This area is restricted to authorized Kiddistan staff.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
      <div className="card-surface w-full max-w-md border border-border/80 p-7 text-center shadow-panel">
        <p className="text-sm text-muted-foreground">
          Loading secure sign-in…
        </p>
      </div>
    </main>
  );
}

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 text-sky-300"
      aria-hidden="true"
    >
      <path d="m21 8-9 5-9-5 9-5 9 5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}