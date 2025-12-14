'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useLocale } from 'next-intl';
import React from 'react';
import { locales } from '@/i18n/routing';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Define original language names
const languageNames = {
  'en': 'English',
  'zh-TW': '繁體中文'
};

type LanguageSwitcherProps = {
  variant?: 'icon' | 'text' | 'full' | 'mobile';
  className?: string;
};

export default function LanguageSwitcher({ 
  variant = 'full',
  className = ''
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  // Get the current locale directly from next-intl
  const currentLocale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale !== currentLocale) {
      router.replace(pathname, { locale: newLocale });
    }
  };

  // Mobile variant shows both languages side by side
  if (variant === 'mobile') {
    return (
      <div className="flex gap-2 w-full">
        {locales.map(locale => (
          <Button
            key={locale}
            variant={locale === currentLocale ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 h-9 justify-center",
              locale === currentLocale 
                ? "bg-[#174F7F] text-white hover:bg-[#174F7F]/90" 
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            )}
            onClick={() => handleLanguageChange(locale)}
            disabled={locale === currentLocale}
          >
            {languageNames[locale as keyof typeof languageNames]}
          </Button>
        ))}
      </div>
    );
  }

  const dropdownTrigger = () => {
    switch (variant) {
      case 'icon':
        return (
          <Button 
            variant="ghost" 
            size="sm"
            className={cn(
              "p-1 h-8 focus-visible:ring-0 focus-visible:ring-offset-0",
              className
            )}
          >
            <Globe className="h-4 w-4" />
          </Button>
        );
      case 'text':
        return (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "p-1 h-8 focus-visible:ring-0 focus-visible:ring-offset-0",
              className
            )}
          >
            {languageNames[currentLocale as keyof typeof languageNames]}
            <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
          </Button>
        );
      default:
        return (
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "px-2 h-8 flex items-center gap-1.5 focus-visible:ring-0 focus-visible:ring-offset-0",
              className
            )}
          >
            <Globe className="h-4 w-4" />
            <span>{languageNames[currentLocale as keyof typeof languageNames]}</span>
            <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
          </Button>
        );
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {dropdownTrigger()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {locales.map(locale => (
          <DropdownMenuItem
            key={locale}
            className={cn(
              "flex items-center justify-between cursor-pointer",
              locale === currentLocale && "bg-accent"
            )}
            onClick={() => handleLanguageChange(locale)}
          >
            <span>{languageNames[locale as keyof typeof languageNames]}</span>
            {locale === currentLocale && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 