"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  })
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  })
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState("")

  function validate() {
    const newErrors = { name: "", email: "", password: "", phone: "", location: "" }
    if (!form.name.trim()) newErrors.name = "Full name is required."
    if (!form.email.trim()) {
      newErrors.email = "Email is required."
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
      newErrors.email = "Enter a valid email address."
    }
    if (!form.password) {
      newErrors.password = "Password is required."
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters."
    }
    if (form.phone.trim() && !/^[\+]?[1-9][\d\s\-\(\)]{7,15}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Enter a valid phone number."
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: "" })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setFormError("")

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Registration failed.")
      }

      // auto login after registration
      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      })

      router.push("/dashboard")
    } catch (err) {
      setFormError(err.message)
    } finally {
      setLoading(false)
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
            Create Your Account
          </h1>
          <p className="text-center text-muted-foreground mb-6 text-sm sm:text-base">
            Start exploring careers, building your CV, and finding opportunities
          </p>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                name="name"
                type="text"
                className={`w-full rounded-lg border px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.name ? "border-red-500" : ""
                  }`}
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                name="email"
                type="email"
                className={`w-full rounded-lg border px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.email ? "border-red-500" : ""
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
                className={`w-full rounded-lg border px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${errors.password ? "border-red-500" : ""
                  }`}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone Number <span className="text-muted-foreground text-xs">(optional)</span></label>
              <input
                name="phone"
                type="tel"
                className={`w-full rounded-lg border px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.phone ? "border-red-500" : ""
                  }`}
                placeholder="+1 (555) 123-4567"
                value={form.phone}
                onChange={handleChange}
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location <span className="text-muted-foreground text-xs">(optional)</span></label>
              <input
                name="location"
                type="text"
                className={`w-full rounded-lg border px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.location ? "border-red-500" : ""
                  }`}
                placeholder="New York, NY"
                value={form.location}
                onChange={handleChange}
              />
              {errors.location && (
                <p className="text-xs text-red-500 mt-1">{errors.location}</p>
              )}
            </div>

            {formError && <p className="text-xs text-red-500 mt-1">{formError}</p>}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>

          <p className="text-sm text-center mt-6 text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
