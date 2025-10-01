import React, { useState, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import Image from 'next/image';
import { isAdmin } from '../../lib/admin';
import {
  Home,
  Search,
  FileText,
  User,
  LogOut,
  Briefcase,
  X,
  Settings
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  isExternal?: boolean;
  href?: string;
}

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onMobileToggle }: SidebarProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeItem, setActiveItem] = useState('dashboard');

  // Get sidebar items based on user permissions
  const getSidebarItems = (): SidebarItem[] => {
    const baseItems: SidebarItem[] = [
      { id: 'dashboard', label: 'Dashboard', icon: Home },
      { id: 'career-explorer', label: 'Career Explorer', icon: Search },
      { id: 'cv-builder', label: 'CV Builder', icon: FileText },
      { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
      { id: 'profile', label: 'Profile', icon: User },
    ];

    // Add admin panel for admin users only
    if (session?.user?.email && isAdmin(session.user.email)) {
      baseItems.push({
        id: 'admin',
        label: 'Admin Panel',
        icon: Settings,
        isExternal: true,
        href: '/admin/users'
      });
    }

    return baseItems;
  };

  const sidebarItems = getSidebarItems();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  const handleItemSelect = (itemId: string, item: SidebarItem) => {
    // Handle external links
    if (item.isExternal && item.href) {
      router.push(item.href);
      if (onMobileToggle) {
        onMobileToggle();
      }
      return;
    }
    
    setActiveItem(itemId);
    // Dispatch custom event to communicate with dashboard page
    window.dispatchEvent(new CustomEvent('sidebar-item-select', { detail: itemId }));
    // Close mobile sidebar when item is selected
    if (onMobileToggle) {
      onMobileToggle();
    }
  };

  // Listen for active component changes from the dashboard page
  useEffect(() => {
    const handleActiveComponentChange = (event: CustomEvent) => {
      setActiveItem(event.detail);
    };

    window.addEventListener('active-component-change', handleActiveComponentChange as EventListener);

    return () => {
      window.removeEventListener('active-component-change', handleActiveComponentChange as EventListener);
    };
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-screen w-64 bg-card border-r border-border flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className='flex items-center space-x-2'>
            <h2 className="text-xl font-bold text-foreground">CareerPad</h2>
            <Image src="/logo_icon.png" alt="Logo" width={40} height={40} className="h-10 w-10" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome, {session?.user?.name?.split(' ')[0] || 'User'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeItem === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemSelect(item.id, item)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${isActive
                        ? 'bg-primary/80 text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer with Logout */}
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={onMobileToggle}
          />

          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-300 ease-in-out">
            {/* Header with close button */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className='flex items-center space-x-2'>
                  <h2 className="text-xl font-bold text-foreground">CareerPad</h2>
                  <Image src="/logo_icon.png" alt="Logo" width={40} height={40} className="h-10 w-10" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMobileToggle}
                  className="lg:hidden"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Welcome, {session?.user?.name?.split(' ')[0] || 'User'}
              </p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
              <ul className="space-y-2">
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.id;

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => handleItemSelect(item.id, item)}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${isActive
                            ? 'bg-primary/80 text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer with Logout */}
            <div className="p-4 border-t border-border">
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}