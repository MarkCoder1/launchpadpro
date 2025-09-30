'use client'
import { House, Info, Mail, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import NavbarIcon from './NavbarIcon';
import GetStartedButton from './GetStartedButton';

export default function NavBar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <nav className="text-black bg-white">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center mt-4 justify-around">
                    {/* Logo or Brand */}
                    <div className="font-bold text-xl">
                        <Link href="/">
                            <Image src='/logo_fit.png' alt={'logo'} width={100} height={100} />
                        </Link>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex space-x-48">
                        <NavbarIcon icon={<House strokeWidth={3} size={36} />} text="HOME" link="/" />

                        <NavbarIcon icon={<Info strokeWidth={3} size={36} />} text="ABOUT" link="/about" />

                        <NavbarIcon icon={<Mail strokeWidth={3} size={36} />} text="CONTACT" link="/contact" />

                    </div>

                   <GetStartedButton />

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            type="button"
                            className="focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            aria-expanded={isMenuOpen ? 'true' : 'false'}
                        >
                                {isMenuOpen ? (
                                // Close icon (X)
                                <X />
                            ) : (
                                // Hamburger icon
                                <Menu />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-gray-700">
                    <Link href="/">
                        <span
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-2 text-white hover:bg-gray-600"
                        >
                            Home
                        </span>
                    </Link>
                    <Link href="/about">
                        <span
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-2 text-white hover:bg-gray-600"
                        >
                            About
                        </span>
                    </Link>
                    <Link href="/contact">
                        <span
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-2 text-white hover:bg-gray-600"
                        >
                            Contact
                        </span>
                    </Link>
                </div>
            )}
        </nav>
    );
}
