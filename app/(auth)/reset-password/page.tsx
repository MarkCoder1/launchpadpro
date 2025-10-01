"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "../../../components/ui/button"
import { Card, CardContent } from "../../../components/ui/card"
import { Lock, ArrowLeft, CheckCircle, AlertTriangle, Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  
  const [verifyingToken, setVerifyingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  const [email, setEmail] = useState("")

  const [errors, setErrors] = useState({ password: "", confirmPassword: "" })
  const [error, setError] = useState("")

  const [success, setSuccess] = useState(false)

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.")
      setVerifyingToken(false)
      return
    }

    verifyToken()
  }, [token])

  async function verifyToken() {
    try {
      const res = await fetch(`/api/auth/reset-password?token=${token}`)
      const data = await res.json()

      if (res.ok && data.valid) {
        setTokenValid(true)
        setEmail(data.email)
      } else {
        setError(data.error || "Invalid or expired reset token")
      }
    } catch (err) {
      setError("Failed to verify reset token")
    } finally {
      setVerifyingToken(false)
    }
  }

  function validateForm() {
    const newErrors = { password: "", confirmPassword: "" }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some(Boolean)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setSuccess(true)
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Loading state while verifying token
  if (verifyingToken) {
    return (
      <main className="min-h-screen bg-background bg-gradient-to-bl from-careerpad-primary/50 to-careerpad-secondary/50">
        <div className="flex items-center justify-center px-4 sm:px-6" style={{ minHeight: '100vh' }}>
          <Card className="w-full max-w-md shadow-lg rounded-2xl">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <h1 className="text-xl font-bold mb-2">Verifying Reset Link</h1>
              <p className="text-muted-foreground">Please wait while we verify your reset token...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Error state for invalid token
  if (!tokenValid) {
    return (
      <main className="min-h-screen bg-background bg-gradient-to-bl from-careerpad-primary/50 to-careerpad-secondary/50">
        <div className="w-full px-4 sm:px-6 pt-4 pb-2 sm:pt-6 sm:pb-4">
          <Link
            href="/login"
            className="inline-flex items-center text-sm sm:text-md text-black-foreground hover:underline transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </div>
        
        <div className="flex items-center justify-center px-4 sm:px-6 pb-6 sm:pb-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>
          <Card className="w-full max-w-md shadow-lg rounded-2xl">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <h1 className="text-xl font-bold mb-2">Invalid Reset Link</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              
              <div className="space-y-3">
                <Link href="/forgot-password">
                  <Button className="w-full">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Success state
  if (success) {
    return (
      <main className="min-h-screen bg-background bg-gradient-to-bl from-careerpad-primary/50 to-careerpad-secondary/50">
        <div className="flex items-center justify-center px-4 sm:px-6" style={{ minHeight: '100vh' }}>
          <Card className="w-full max-w-md shadow-lg rounded-2xl">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h1 className="text-xl font-bold mb-2">Password Reset Successful!</h1>
              <p className="text-muted-foreground mb-6">
                Your password has been successfully reset. You'll be redirected to the login page in a moment.
              </p>
              
              <Link href="/login">
                <Button className="w-full">
                  Continue to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  // Main reset password form
  return (
    <main className="min-h-screen bg-background bg-gradient-to-bl from-careerpad-primary/50 to-careerpad-secondary/50">
      <div className="w-full px-4 sm:px-6 pt-4 pb-2 sm:pt-6 sm:pb-4">
        <Link
          href="/login"
          className="inline-flex items-center text-sm sm:text-md text-black-foreground hover:underline transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Login
        </Link>
      </div>
      
      <div className="flex items-center justify-center px-4 sm:px-6 pb-6 sm:pb-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <Card className="w-full max-w-md shadow-lg rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              
              <h1 className="text-xl sm:text-2xl font-bold mb-2">
                Reset Your Password
              </h1>
              <p className="text-muted-foreground text-sm">
                Enter your new password for <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors({ ...errors, password: "" })
                      setError("")
                    }}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    placeholder="Enter new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      setErrors({ ...errors, confirmPassword: "" })
                      setError("")
                    }}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.confirmPassword ? "border-red-500" : ""
                    }`}
                    placeholder="Confirm new password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full bg-primary text-primary-foreground"
              >
                {loading ? "Resetting Password..." : "Reset Password"}
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