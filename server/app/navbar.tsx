'use client'

import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { Menu, LogOut, User } from 'lucide-react'
import LanguageSwitcher from './components/LanguageSwitcher'
import { Link as IntlLink } from '@/i18n/routing'
import { useTranslations } from 'next-intl'

interface NavbarProps {
  toggleSidebar: () => void
}

export default function Navbar({ toggleSidebar }: NavbarProps) {
  const { data: session } = useSession()
  const [isScrolled, setIsScrolled] = useState(false)
  const t = useTranslations('navigation')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`bg-white shadow transition-all duration-300 ${
      isScrolled ? 'h-12' : 'h-16'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Hamburger menu for sidebar toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="mr-2"
            aria-label="Toggle sidebar"
          >
            <Menu className={`transition-all duration-300 ${
              isScrolled ? 'h-4 w-4' : 'h-5 w-5'
            } text-gray-600`} />
          </Button>

          {/* Logo */}
          <div className="flex-shrink-0 flex-1 flex justify-center md:justify-start">
            <IntlLink href="/" className="flex items-center">
              <Image
                src="/logo_small.png"
                alt="evoke AI logo"
                width={200}
                height={64}
                className={`transition-all duration-300 ${
                  isScrolled ? 'h-8 w-auto' : 'h-10 w-auto'
                }`}
                priority
              />
            </IntlLink>
          </div>

          {/* Desktop user section - Only visible on desktop */}
          <div className="hidden md:flex items-center">
            {session ? (
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                {/* Username on left */}
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-gray-700 truncate max-w-[120px]">
                    {session.user?.name ?? session.user?.email}
                  </span>
                </div>
                
                <div className="h-6 w-px bg-gray-200 mx-0.5"></div>
                <LanguageSwitcher variant="icon" className="mx-1" />
                <div className="h-6 w-px bg-gray-200 mx-0.5"></div>
                
                {/* Logout on right */}
                <Button
                  variant="ghost"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="justify-start gap-2 whitespace-nowrap font-medium py-1.5 h-9 rounded-none"
                  size="sm"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('logout')}</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center">
                <LanguageSwitcher variant="icon" className="mr-2" />
                <IntlLink href="/login" className="block">
                  <Button 
                    className="bg-[#174F7F] hover:bg-[#174F7F]/90 text-white gap-2 font-medium px-8 min-w-[120px]"
                    size={isScrolled ? "sm" : "default"}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('login')}</span>
                  </Button>
                </IntlLink>
              </div>
            )}
          </div>
          
          {/* Empty div for mobile to maintain spacing */}
          <div className="md:hidden w-9"></div>
        </div>
      </div>
    </nav>
  )
} 