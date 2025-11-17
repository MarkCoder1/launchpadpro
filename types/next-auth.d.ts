import NextAuth from "next-auth"

declare module "next-auth" {
  interface User {
    id: string
    email: string
    name?: string | null
    phone?: string | null
    location?: string | null
    createdAt?: Date
  }

  interface Session {
    user: {
      image?: string | null
      id: string
      email: string
      name?: string | null
      phone?: string | null
      location?: string | null
      createdAt?: Date
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    phone?: string | null
    location?: string | null
    createdAt?: Date
  }
}