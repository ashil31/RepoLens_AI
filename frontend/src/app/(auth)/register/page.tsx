"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { register } from "@/services/auth.service";
import { ApiClientError } from "@/lib/api/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register({ email, password });
      setUserId(res.userId);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (userId) {
    return (
      <VerifyOtpStep userId={userId} onBack={() => setUserId(null)} />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-foreground">Sign up</h1>
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
            Password (min 6 characters)
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full"
            autoComplete="new-password"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading} variant="default" size="cta" className="w-full">
          {loading ? "Creating account…" : "Sign up"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}

function VerifyOtpStep({ userId, onBack }: { userId: string; onBack: () => void }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { verifyOtp } = await import("@/services/auth.service");
      await verifyOtp({ userId, code });
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold text-foreground">Verify your email</h1>
      <p className="text-center text-sm text-muted-foreground">
        We sent a 6-digit code to your email. Enter it below.
      </p>
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
        <div>
          <label htmlFor="code" className="mb-1 block text-sm font-medium text-foreground">
            Verification code
          </label>
          <Input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            required
            className="w-full font-mono text-center text-lg tracking-widest"
            autoComplete="one-time-code"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" disabled={loading || code.length !== 6} variant="default" size="cta" className="w-full">
          {loading ? "Verifying…" : "Verify"}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} className="w-full">
          Back
        </Button>
      </form>
    </div>
  );
}
