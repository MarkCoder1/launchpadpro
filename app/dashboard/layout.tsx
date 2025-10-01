'use client'
import { Geist, Geist_Mono } from "next/font/google";
import "../(main)/globals.css";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import Sidebar from "../../components/dashboard/Sidebar";
import MobileNav from "../../components/layout/MobileNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased m-0 p-0 bg-background min-h-screen`}>
        <SessionProvider>
          <div className="flex h-screen">
            {/* Sidebar Component */}
            <Sidebar 
              isMobileOpen={isMobileSidebarOpen} 
              onMobileToggle={toggleMobileSidebar}
            />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Mobile Navigation */}
              <MobileNav onMenuToggle={toggleMobileSidebar} />
              
              {/* Content */}
              <main className="flex-1 overflow-auto">
                <div className="p-4 sm:p-6 lg:p-8">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </SessionProvider>
      </body>
    </html>
  )
}