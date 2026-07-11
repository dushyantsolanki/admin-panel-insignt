"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Loader2, HelpCircle } from "@/components/icons";
import { useAuthStore } from "@/store/useAuthStore";
import { gooeyToast } from "goey-toast";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const dynamicImage = useMemo(() => `https://picsum.photos/seed/${Date.now()}/800/630`, []);

  const fillCredentials = () => {
    setEmail("john@example.com");
    setPassword("password123");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Update Zustand store
      setAuth(data.user, data.token);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      const errorMessage = err.message || "Something went wrong. Please try again.";
      setError(errorMessage);
      gooeyToast.error('Login Failed', {
        description: errorMessage,
      });
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background text-foreground overflow-hidden">
      <div className="w-full max-w-4xl relative z-10 flex flex-col gap-6 transition-all">
        <Card className="overflow-hidden p-0 border-none shadow-2xl">
          <CardContent className="grid p-0 md:grid-cols-2">

            {/* Left Side: Form */}
            <form onSubmit={handleLogin} className="p-6 md:p-8 flex flex-col justify-center bg-card">
              <div className="flex flex-col items-center gap-2 text-center mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your Admin Panel
                </p>
              </div>

              {/* HR Demo Credentials Note */}
              <div
                onClick={fillCredentials}
                className="mb-6 p-4 rounded-xl border border-border bg-muted/30 text-xs text-muted-foreground leading-relaxed flex flex-col gap-2 relative overflow-hidden group cursor-pointer hover:bg-muted/50 transition-all duration-300 select-none"
                title="Click to auto-fill credentials"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-[10px] text-foreground">
                    <HelpCircle className="size-3.5" />
                    <span>HR / Reviewer Notice</span>
                  </div>
                  <span className="text-[10px] font-medium">Click to autofill →</span>
                </div>
                <div>
                  Use the following credentials to access the admin dashboard:
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1 bg-background p-2.5 rounded-lg border border-border font-mono">
                  <div>
                    <span className="text-muted-foreground/60 block text-[9px] uppercase tracking-wider mb-0.5">Email</span>
                    <span className="text-foreground font-medium select-all">john@example.com</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/60 block text-[9px] uppercase tracking-wider mb-0.5">Password</span>
                    <span className="text-foreground font-medium select-all">password123</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-center justify-center gap-2 mb-4 font-medium">
                  <Lock className="size-4" />
                  {error}
                </div>
              )}

              <div className="grid gap-4">
                <div className="grid gap-1.5">
                  <label className="text-sm font-medium leading-none" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@pro.com"
                      required
                      className="h-11 pl-10 border border-accent-foreground/20 bg-background"
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <div className="flex items-center">
                    <label className="text-sm font-medium leading-none" htmlFor="password">
                      Password
                    </label>
                    <Link
                      href="#"
                      className="ml-auto text-sm text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="h-11 pl-10 border border-accent-foreground/20 bg-background"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2 my-1">
                  <Checkbox id="remember" className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" />
                  <label htmlFor="remember" className="text-sm font-medium leading-none text-muted-foreground cursor-pointer select-none">
                    Remember me for 7 days
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 mt-2 text-base font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </div>
            </form>

            {/* Right Side: Image */}
            <div className="relative hidden bg-zinc-950 md:block">
              <img
                src={dynamicImage}
                alt="Login Illustration"
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent flex flex-col justify-end p-10">
                <h2 className="text-white text-2xl font-bold mb-2">Elevate Your Content</h2>
                <p className="text-zinc-400 text-sm max-w-[280px]">
                  Join the administrators organizing the digital world with intelligence and style.
                </p>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
