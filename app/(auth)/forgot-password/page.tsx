"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  function validateEmail(email: string) {
    if (!email.trim()) {
      return "Email is required"
    }
    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return "Enter a valid email address"
    }
    return ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong")
      }

      setSuccess(true)
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-background bg-gradient-to-bl from-careerpad-primary/50 to-careerpad-secondary/50">
        {/* Back button - responsive positioning */}
        <div className="w-full px-4 sm:px-6 pt-4 pb-2 sm:pt-6 sm:pb-4">
          <Link
            href="/login"
            className="inline-flex items-center text-sm sm:text-md text-black-foreground hover:underline transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </div>
        
        {/* Centered card container */}
        <div className="flex items-center justify-center px-4 sm:px-6 pb-6 sm:pb-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <Card className="w-full max-w-md sm:max-w-lg shadow-lg rounded-2xl">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h1 className="text-xl sm:text-2xl font-bold mb-2">Check Your Email</h1>
              
              <p className="text-muted-foreground mb-6 text-sm sm:text-base">
                If an account with <strong>{email}</strong> exists, we've sent a password reset link to your email address.
              </p>
              
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  • Check your inbox and spam folder<br/>
                  • The link will expire in 1 hour<br/>
                  • If you don't receive it, you can try again
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSuccess(false)}
                    className="flex-1"
                  >
                    Try Another Email
                  </Button>
                  <Link href="/login" className="flex-1">
                    <Button className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background bg-gradient-to-bl from-careerpad-primary/50 to-careerpad-secondary/50">
      {/* Back button - responsive positioning */}
      <div className="w-full px-4 sm:px-6 pt-4 pb-2 sm:pt-6 sm:pb-4">
        <Link
          href="/login"
          className="inline-flex items-center text-sm sm:text-md text-black-foreground hover:underline transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Link>
      </div>
      
      {/* Centered card container */}
      <div className="flex items-center justify-center px-4 sm:px-6 pb-6 sm:pb-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <Card className="w-full max-w-md sm:max-w-lg shadow-lg rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              
              <h1 className="text-xl sm:text-2xl font-bold mb-2">
                Forgot Password?
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError("")
                  }}
                  className={`w-full rounded-lg border px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                    error ? "border-red-500" : ""
                  }`}
                  placeholder="you@example.com"
                  disabled={loading}
                />
                {error && (
                  <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-primary text-primary-foreground"
              >
                {loading ? "Sending Reset Link..." : "Send Reset Link"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Back to Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}