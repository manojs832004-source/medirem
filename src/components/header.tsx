'use client';

import type { LanguageKey } from '@/lib/languages';
import { languages, getUIContent } from '@/lib/languages';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages, Pill, LayoutDashboard, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HeaderProps {
  language: LanguageKey;
  setLanguage: (language: LanguageKey) => void;
}

export default function Header({ language, setLanguage }: HeaderProps) {
  const content = getUIContent(language);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 w-full bg-transparent">
        <div className="container mx-auto flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full shadow-lg">
                      <Pill className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-headline font-bold text-foreground">
                      {content.appName}
                  </h1>
                </Link>
            </div>
            <div className="flex items-center gap-2">
                <nav className="hidden md:flex items-center gap-2">
                    <Button asChild variant="ghost" className={cn(pathname === '/dashboard' && 'bg-accent text-accent-foreground')}>
                        <Link href="/dashboard">
                            <LayoutDashboard className="mr-2 h-5 w-5" />
                            {content.dashboard}
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" className={cn(pathname === '/suggestions' && 'bg-accent text-accent-foreground')}>
                        <Link href="/suggestions">
                            <Lightbulb className="mr-2 h-5 w-5" />
                            {content.suggestions}
                        </Link>
                    </Button>
                </nav>

                <Select value={language} onValueChange={(value) => setLanguage(value as LanguageKey)}>
                <SelectTrigger className="w-auto md:w-[180px] gap-2 bg-card/50">
                    <Languages className="h-5 w-5 text-muted-foreground" />
                    <SelectValue placeholder={content.language} />
                </SelectTrigger>
                <SelectContent>
                    {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
        </div>
        <div className="md:hidden flex justify-center gap-2 p-2 border-b bg-transparent">
             <Button asChild variant="ghost" className={cn("flex-1", pathname === '/dashboard' && 'bg-accent text-accent-foreground')}>
                <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-5 w-5" />
                    {content.dashboard}
                </Link>
            </Button>
            <Button asChild variant="ghost" className={cn("flex-1", pathname === '/suggestions' && 'bg-accent text-accent-foreground')}>
                <Link href="/suggestions">
                    <Lightbulb className="mr-2 h-5 w-5" />
                    {content.suggestions}
                </Link>
            </Button>
        </div>
    </header>
  );
}
