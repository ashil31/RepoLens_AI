"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { login } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { toast } from "@/lib/toast";
import { ApiClientError } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login({ email, password });
      setAuth(res.accessToken, res.user);
      toast.success("Welcome back", "You have been signed in.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const msg = err instanceof ApiClientError ? err.message : "Login failed";
      setError(msg);
      toast.error("Sign in failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">Log in</h1>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full"
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
            autoComplete="current-password"
          />
        </div>
        <Button type="submit" disabled={loading} variant="default" size="cta" className="w-full">
          {loading ? "Signing in…" : "Log in"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-foreground underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </div>
  );
}
