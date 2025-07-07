'use client'
import GetStartedButton from "@/components/GetStartedButton";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Disable scroll when this component mounts
    document.body.style.overflow = "hidden";

    return () => {
      // Re-enable scroll when component unmounts
      document.body.style.overflow = "auto";
    };
  }, []);
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-300px)] p-4 md:p-0">
      <div className="flex flex-row justify-between items-center w-full max-w-5xl">
        {/* text */}
        <div className="flex-1 flex flex-col">
          {/*title */}
          <div className="text-5xl font-bold tracking-wider flex-shrink-0">
        <h1 className="mb-3">Welcome to </h1>
        <h1 className="mb-5">Launchpad Pro!</h1>
          </div>
          {/*brief */}
          <span className="font-semibold mb-5">Find scholarships, internships & jobs — all in one place.<br />
        Save your favorites, get deadline reminders, and level up your future!</span>
          <GetStartedButton />
        </div>
        {/* image */}
        <Image
          src="/hand_writing.png"
          alt="hand writing"
          width={500}
          height={500}
          className="hidden md:block"
        />
      </div>
    </div>
  );
}
