"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  function validate() {
    const newErrors = { email: "", password: "" };
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!form.password) {
      newErrors.password = "Password is required.";
    }
    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setFormError("Invalid email or password.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      setFormError(`Something went wrong. Please try again. ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 bg-gradient-to-bl from-careerpad-primary/50 to-careerpad-secondary/50">
      <Link
        href="/"
        className="absolute top-4 left-4 text-md text-black-foreground hover:underline"
      >
        &larr; Back to Home
      </Link>
      <Card className="w-full max-w-md sm:max-w-lg md:max-w-xl shadow-lg rounded-2xl mx-2 sm:mx-0">
        <CardContent className="p-4 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-2">
            Welcome Back
          </h1>
          <p className="text-center text-muted-foreground mb-6 text-sm sm:text-base">
            Sign in to your account to continue your career journey
          </p>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                className={`w-full rounded-lg border px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.email ? "border-red-500" : ""
                }`}
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                name="password"
                type="password"
                className={`w-full rounded-lg border px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.password ? "border-red-500" : ""
                }`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            {formError && (
              <div className="text-red-500 text-sm text-center">
                {formError}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-center mt-6 text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
