import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

const Page = () => {
  return (
    <div className="h-screen flex justify-center items-center">
      <div className="absolute top-0 left-0 z-10">
        <Link href="/">
          <Image src="/logo.png" alt="logo" width={100} height={100} />
        </Link>
      </div>
      <div className="w-full max-w-6xl flex shadow-lg rounded-xl overflow-hidden bg-white">

        {/* Left Side */}
        <div className="relative w-1/2 bg-white p-8 flex justify-center items-center">

          <div className="w-[400px] h-[600px] relative">
            <Image
              src="/register_image.png"
              alt="Workflow"
              fill
              style={{ objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="w-1/2 bg-registerRightPanel p-12">
          <h2 className="text-5xl font-bold mb-6 text-center flex justify-center">Create Account</h2>
          {/*Form */}
          <div className='flex justify-center'>
            asd
          </div>
        </div>

      </div>
    </div>
  )
}

export default Page
