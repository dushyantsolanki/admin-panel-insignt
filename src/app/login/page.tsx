"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Loader2 } from "@/components/icons";
import { useAuthStore } from "@/store/useAuthStore";
import { gooeyToast } from "goey-toast";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#0a0a0a] overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-violet-600/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px]" />

      <Card className="w-full max-w-md border-white/10 bg-white/5 backdrop-blur-xl text-white shadow-2xl relative z-10 transition-all">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription className="text-muted-foreground/80 capitalize">
            Enter your credentials to access the <span className="text-white font-bold">admin panel</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0a0a0a] px-2 text-muted-foreground font-medium tracking-wider">Credentials</span>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <Lock className="size-3" />
                {error}
              </div>
            )}

            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium leading-none" htmlFor="email">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@pro.com"
                    required
                    className="border-white/10 bg-white/5 text-white placeholder:text-muted-foreground/30 focus-visible:ring-violet-500 h-11 pl-10 transition-all focus:bg-white/10"
                  />
                </div>
              </div>
              <div className="grid gap-2">

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="border-white/10 bg-white/5 text-white focus-visible:ring-violet-500 h-11 pl-10 transition-all focus:bg-white/10"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox id="remember" className="border-white/20 data-[state=checked]:bg-violet-600" />
              <label htmlFor="remember" className="text-sm font-medium leading-none text-muted-foreground cursor-pointer select-none">
                Remember me for 7 days
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] transition-all active:scale-[0.98] h-12 font-semibold text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-center w-full text-muted-foreground/40 text-[10px] uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} AdminPanel Pro. Secured by JWT.
      </div>
    </div>
  );
}
