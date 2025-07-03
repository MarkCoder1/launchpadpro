import Link from 'next/link'
import React from 'react'

const NavbarIcon = ({ icon, text, link }: { icon: React.ReactElement, text: string, link: string }) => {
    return (
        <Link href={link}>
            <div className="relative group w-10 h-10 cursor-pointer">
                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-700 group-hover:opacity-0 transition-opacity duration-300">
                    {icon}
                </div>

                {/* Text */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-700 font-medium text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {text}
                </div>
            </div>
        </Link>

    )
}

export default NavbarIcon
