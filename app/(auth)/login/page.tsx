"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: typeof errors = {};
        if (!email) {
            newErrors.email = "Email is required.";
        } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            newErrors.email = "Enter a valid email address.";
        }
        if (!password) {
            newErrors.password = "Password is required.";
        }
        return newErrors;
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        setLoading(true);
        // Add your login logic here
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-careerpad-primary/50 to-careerpad-secondary/50">
            <Link href="/" className="absolute top-4 left-4 text-md text-black-foreground hover:underline">
                &larr; Back to Home
            </Link>
            <div className="w-full max-w-md rounded-2xl bg-white/90 shadow-xl p-8">
                <h2 className="text-3xl font-bold text-center text-primary">CareerPad</h2>
                <p className="text-center text-muted-foreground mt-1">Welcome back! Log in to continue.</p>

                <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            className={`w-full mt-1 px-4 py-2 rounded-lg border ${
                                errors.email ? "border-red-500" : "border-gray-300"
                            } focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        {errors.email && (
                            <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                            type="password"
                            className={`w-full mt-1 px-4 py-2 rounded-lg border ${
                                errors.password ? "border-red-500" : "border-gray-300"
                            } focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary`}
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        {errors.password && (
                            <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-4 bg-primary text-white py-2 rounded-lg font-semibold shadow-md hover:bg-primary-dark transition-colors"
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Don’t have an account?{" "}
                    <Link href="/register" className="text-primary font-medium hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
