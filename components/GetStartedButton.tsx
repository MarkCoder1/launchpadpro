'use client'
import React from 'react'

const GetStartedButton = () => {
    return (
        <a
            className="bg-gradient-to-r from-buttonStart to-buttonEnd py-2 px-4 md:px-10 rounded-lg hover:scale-105 hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 text-white font-medium w-fit"
            href='/register'
        >
            Get Started
        </a>
    )
}

export default GetStartedButton