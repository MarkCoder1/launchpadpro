'use client'
import GetStartedButton from "../../../components/GetStartedButton";

export default function About() {
    return (
        <div className="py-14 px-6 h-screen">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-3xl font-light text-gray-900 mb-6">
                        About
                    </h1>
                    <p className="text-gray-600 text-lg leading-relaxed">
                        Empowering students to build their future careers with AI-powered tools and opportunities.
                    </p>
                </div>

                <div className="space-y-12">
                    <div>
                        <h2 className="text-xl font-medium text-gray-900 mb-4">
                            Why I Built This
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Navigating the overwhelming world of career planning can be challenging. This platform was created to help high school and college students discover their potential, build professional resumes, and find real opportunities that match their goals.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-medium text-gray-900 mb-4">
                            What You&apos;ll Find Here
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Powerful tools designed to accelerate your career journey:
                        </p>
                        <div className="space-y-3 text-gray-600">
                            <p><strong>AI Career Explorer</strong> — Discover careers that match your interests and skills</p>
                            <p><strong>Opportunity Feed</strong> — Browse internships, scholarships, and jobs updated daily</p>
                            <p><strong>AI CV Builder</strong> — Create professional resumes tailored to your field</p>
                            <p><strong>And more</strong>...</p>
                        </div>
                    </div>

                    <div >
                        <h2 className="text-xl font-medium text-gray-900 mb-4">
                            My Mission
                        </h2>
                        <p className="text-gray-600">
                            Every student deserves access to career guidance and opportunities, regardless of their background.
                            This platform bridges the gap between education and employment, making career planning accessible,
                            personalized, and effective.
                        </p>
                    </div>
                </div>
                <div className="py-6">
                    <GetStartedButton />
                </div>
            </div>
        </div>
    )
}