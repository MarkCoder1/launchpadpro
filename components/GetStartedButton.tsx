'use client'
import React from 'react'

const GetStartedButton = () => {
    return (
        <a
            className="bg-gradient-to-r from-getStartedButtonStart to-getStartedButtonEnd py-2 px-4 md:px-10 rounded-lg  hover:shadow-lg hover:shadow-sky-300 transition-all duration-300 text-white font-medium w-fit"
            href='/register'
        >
            Get Started
        </a>
    )
}

export default GetStartedButton