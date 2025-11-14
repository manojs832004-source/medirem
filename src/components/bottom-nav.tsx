
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Plus, BrainCircuit, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/dashboard', icon: Calendar, label: 'Calendar' },
    { href: '/suggestions', icon: BrainCircuit, label: 'AI' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  if (!mounted || pathname === '/login' || pathname === '/signup' || pathname === '/add') {
    return null;
  }

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-24 bg-card border-t rounded-t-3xl z-50">
      <div className="container mx-auto h-full flex justify-around items-center relative">
        {navItems.slice(0, 2).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-muted-foreground w-1/5">
              <item.icon className={cn('h-6 w-6 transition-colors', isActive && 'text-primary')} />
            </Link>
          );
        })}
        
        <div className="w-1/5 flex justify-center">
             <Button asChild size="icon" className="w-16 h-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 absolute -top-8 text-primary-foreground">
                <Link href="/add">
                    <Plus className="h-8 w-8" />
                </Link>
             </Button>
        </div>

        {navItems.slice(2, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-muted-foreground w-1/5">
              <item.icon className={cn('h-6 w-6 transition-colors', isActive && 'text-primary')} />
            </Link>
          );
        })}
      </div>
    </footer>
  );
}
