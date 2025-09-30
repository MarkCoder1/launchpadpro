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
        <nav className="text-black bg-white w-full shadow-md">
            <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center mt-4 justify-between">
                    {/* Logo or Brand */}
                    <div className="font-bold text-xl flex-shrink-0">
                        <Link href="/">
                            <Image src='/logo_fit.png' alt={'logo'} width={80} height={80} className="w-20 h-20 object-contain" />
                        </Link>
                    </div>

                    {/* Desktop & Tablet Menu */}
                    <div className="hidden md:flex md:items-center space-x-8 lg:space-x-16">
                        <NavbarIcon icon={<House strokeWidth={3} size={28} />} text="HOME" link="/" />
                        <NavbarIcon icon={<Info strokeWidth={3} size={28} />} text="ABOUT" link="/about" />
                        <NavbarIcon icon={<Mail strokeWidth={3} size={28} />} text="CONTACT" link="/contact" />
                    </div>

                    {/* Get Started Button (visible on md and up) */}
                    <div className="hidden md:block">
                        <GetStartedButton />
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            type="button"
                            className="focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            aria-expanded={isMenuOpen ? 'true' : 'false'}
                        >
                            {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black bg-opacity-60 z-50 flex flex-col">
                    <div className="bg-white w-4/5 max-w-xs h-full p-6 shadow-lg">
                        <div className="flex justify-between items-center mb-8">
                            <Link href="/">
                                <Image src='/logo_fit.png' alt={'logo'} width={60} height={60} className="w-16 h-16 object-contain" />
                            </Link>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="focus:outline-none"
                                aria-label="Close menu"
                            >
                                <X size={28} />
                            </button>
                        </div>
                        <nav className="flex flex-col space-y-4">
                            <Link href="/">
                                <span
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-4 py-2 text-black hover:bg-gray-100 rounded"
                                >
                                    Home
                                </span>
                            </Link>
                            <Link href="/about">
                                <span
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-4 py-2 text-black hover:bg-gray-100 rounded"
                                >
                                    About
                                </span>
                            </Link>
                            <Link href="/contact">
                                <span
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block px-4 py-2 text-black hover:bg-gray-100 rounded"
                                >
                                    Contact
                                </span>
                            </Link>
                            <div className="mt-6">
                                <GetStartedButton />
                            </div>
                        </nav>
                    </div>
                    {/* Click outside to close */}
                    <div
                        className="flex-1"
                        onClick={() => setIsMenuOpen(false)}
                        aria-hidden="true"
                    />
                </div>
            )}
        </nav>
    );
}
