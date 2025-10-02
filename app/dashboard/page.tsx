'use client'
import { useEffect, useState, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardHome from "../../components/dashboard/DashboardHome"
import CareerExplorer from "../../components/dashboard/CareerExplorer"
import CVBuilder from "../../components/dashboard/CVBuilder"
import Opportunities from "../../components/dashboard/Opportunities"
import Profile from "../../components/dashboard/Profile"

function DashboardContent() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Get active component from URL params or default to dashboard
    const [activeComponent, setActiveComponent] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            return params.get('component') || 'dashboard';
        }
        return 'dashboard';
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login")
        }
    }, [status, router])

    // Listen for URL parameter changes
    useEffect(() => {
        const component = searchParams.get('component') || 'dashboard';
        setActiveComponent(component);
    }, [searchParams]);

    // Listen for sidebar events via custom event
    useEffect(() => {
        const handleSidebarItemSelect = (event: CustomEvent) => {
            setActiveComponent(event.detail);
        };

        window.addEventListener('sidebar-item-select', handleSidebarItemSelect as EventListener);
        
        return () => {
            window.removeEventListener('sidebar-item-select', handleSidebarItemSelect as EventListener);
        };
    }, []);

    // Notify sidebar about active component changes
    useEffect(() => {
        window.dispatchEvent(new CustomEvent('active-component-change', { detail: activeComponent }));
    }, [activeComponent]);

    if (status === "loading") {
        return <div className="flex items-center justify-center h-full">
            <div className="text-lg">Loading...</div>
        </div>
    }

    if (!session) {
        return null
    }

    const renderActiveComponent = () => {
        switch (activeComponent) {
            case 'dashboard':
                return <DashboardHome />
            case 'career-explorer':
                return <CareerExplorer />
            case 'cv-builder':
                return <CVBuilder />
            case 'opportunities':
                return <Opportunities />
            case 'profile':
                return <Profile />
            default:
                return <DashboardHome />
        }
    }

    return (
        <div className="h-full">
            {renderActiveComponent()}
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-full">
                <div className="text-lg">Loading...</div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}