import React from 'react';
import { Button } from '../ui/button';
import { Menu, User } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface MobileNavProps {
  onMenuToggle: () => void;
}

export default function MobileNav({ onMenuToggle }: MobileNavProps) {
  const { data: session } = useSession();

  return (
    <div className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between">
      {/* Left side - Menu button and logo */}
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center space-x-2">
          <h1 className="text-lg font-bold text-foreground">CareerPad</h1>
          <Image src="/logo_icon.png" alt="Logo" width={32} height={32} className="h-8 w-8" />
        </div>
      </div>

      {/* Right side - User info */}
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:block">
          {session?.user?.name?.split(' ')[0] || 'User'}
        </span>
      </div>
    </div>
  );
}