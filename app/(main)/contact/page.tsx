'use client'
import React, {useEffect, useState } from 'react'

interface FormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

const Page = () => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    useEffect(() => {
        document.body.style.overflow = "hidden";

        return () => {
            // Re-enable scroll when component unmounts
            document.body.style.overflow = "auto";
        };
    }, [])

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-300px)] text-black">
            <div className="flex flex-row justify-between items-center w-full max-w-5xl">
                {/* text */}
                <div className="flex-1 flex flex-col">
                    {/*title */}
                    <div className="text-5xl font-bold tracking-wider flex-shrink-0">
                        <h1 className="mb-3">Contact Me!</h1>
                    </div>
                    {/*brief */}
                    <span className='mb-4 font-bold'>
                        Thank you for your interest in getting in touch!
                    </span>

                    <span className='font-bold max-w-96'>I value open communication and welcome any inquiries, feedback, or collaboration opportunities. Please don&apos;t hesitate to get in touch with me by filling out the contact form, especially if you find any errors!</span>
                </div>
                {/* image */}
                <form action="https://formsubmit.co/marcalber59@gmail.com" method='POST' className="space-y-4 mt-24">
                    {/* Name and Email Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <input
                                type="text"
                                name="name"
                                placeholder="Name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="shadow-md w-full px-4 py-3   placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-300"
                            />
                        </div>
                        <div>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="shadow-md w-full px-4 py-3  placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-300"
                            />
                        </div>
                    </div>

                    {/* Subject Field */}
                    <div>
                        <input
                            type="text"
                            name="subject"
                            placeholder="Subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            className="shadow-md w-full px-4 py-3  placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-300"
                        />
                    </div>

                    {/* Message Field */}
                    <div>
                        <textarea
                            name="message"
                            placeholder="Message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows={8}
                            className="shadow-md w-full px-4 py-3  placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-300 resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-8 py-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-sky-900"
                        >
                            Send
                        </button>
                    </div>
                </form>
            </div>
        </div >
    )
}

export default Page
