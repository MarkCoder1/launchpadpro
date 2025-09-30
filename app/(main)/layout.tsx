import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from '../../components/Navbar';
import { SessionProvider } from "next-auth/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareerPad - AI Career Assistant",
  description: "Empowering students with AI-driven career guidance and job placement.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased m-0 p-0 bg-careerpad-light to-stone-50 min-h-screen`}>
        <Navbar />
        <main className="">
          <SessionProvider>{children}</SessionProvider>
        </main>
      </body>
    </html>
  );
}

