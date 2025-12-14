'use client'

import { useSession, signOut } from 'next-auth/react'
import { useDrag } from '@use-gesture/react'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, 
  Users,
  Building,
  LogOut, 
  User,
  Settings,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { Link as IntlLink } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import { useState, useEffect, useCallback } from 'react'
import LanguageSwitcher from './LanguageSwitcher'

interface SidebarProps {
  isOpen: boolean
  isMobile: boolean
  toggle: () => void
  open: () => void
  close: () => void
  isNavbarVisible: boolean
}

interface ManagedSchool {
  id: string
  name: string
  code: string
}

export default function Sidebar({ isOpen, isMobile, open, close, isNavbarVisible }: SidebarProps) {
  const { data: session } = useSession()
  const t = useTranslations('navigation')
  const [managedSchools, setManagedSchools] = useState<ManagedSchool[]>([])
  const [schoolsExpanded, setSchoolsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Determine if sidebar should show expanded content
  // On mobile: always follow isOpen state
  // On desktop: show expanded if isOpen OR isHovered
  const shouldShowExpanded = isMobile ? isOpen : (isOpen || isHovered)
  
  // Memoize fetchManagedSchools to prevent infinite loops
  const fetchManagedSchools = useCallback(async () => {
    try {
      const response = await fetch('/api/user/managed-schools')
      if (response.ok) {
        const data = await response.json()
        setManagedSchools(data.schools || [])
      }
    } catch (error) {
      console.error('Error fetching managed schools:', error)
    }
  }, []) // Empty dependency array - setManagedSchools is stable

  // Fetch managed schools for school admins
  useEffect(() => {
    if (session?.user && !session.user.isSuperAdmin) {
      fetchManagedSchools()
    }
  }, [session?.user, fetchManagedSchools])

  // Setup drag gesture for mobile swipe - memoize the bind function
  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], direction: [dx], cancel }) => {
      // Threshold values
      const threshold = 50;
      const velocityThreshold = 0.5;
      
      // If swiping right with sufficient movement or velocity
      if ((mx > threshold && dx > 0) || (vx > velocityThreshold && dx > 0)) {
        open();
        cancel();
      }
      // If swiping left with sufficient movement or velocity
      else if ((mx < -threshold && dx < 0) || (vx > velocityThreshold && dx < 0)) {
        close();
        cancel();
      }
    },
    { 
      filterTaps: true, 
      axis: 'x',
      enabled: isMobile // Only enable on mobile
    }
  );

  return (
    <>
      {/* Backdrop overlay (mobile only) */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={close}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <aside
        {...(isMobile ? bind() : {})}
        onMouseEnter={() => !isMobile && setIsHovered(true)}
        onMouseLeave={() => !isMobile && setIsHovered(false)}
        className={`
          fixed left-0
          flex flex-col
          transition-all duration-300 ease-in-out
          bg-white shadow-md
          ${isMobile 
            ? `z-50 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}` // Mobile: slide in/out, top layer
            : `z-30 ${shouldShowExpanded ? 'w-64' : 'w-16'}` // Desktop: collapse/expand width based on open state or hover
          }
          ${isNavbarVisible ? 'top-16 h-[calc(100vh-4rem)]' : 'top-0 h-screen'}
          pt-4
        `}
      >
        {/* Top section with navigation links */}
        <div className="flex-1 overflow-y-auto px-3">
          {/* Dashboard Link */}
          <IntlLink href="/" className="block mb-2">
            <Button 
              variant="ghost" 
              className={`w-full justify-start gap-2 font-medium text-[#174F7F] hover:text-[#174F7F]/90 hover:bg-gray-100 ${
                !shouldShowExpanded ? 'justify-center px-2' : ''
              }`}
            >
              <LayoutDashboard className="h-5 w-5 flex-shrink-0" />
              {shouldShowExpanded && <span>{t('dashboard')}</span>}
            </Button>
          </IntlLink>
        </div>
        
        {/* Bottom section: Admin link, Desktop Toggle, and Mobile User Info */}
        <div className="border-t border-gray-200 pt-4 px-3 pb-4">
          {/* Profile Link - Available to all authenticated users */}
          {session?.user && (
            <IntlLink href="/profile" className="block mb-2">
              <Button
                variant="ghost"
                className={`w-full justify-start gap-2 font-medium text-[#174F7F] hover:text-[#174F7F]/90 hover:bg-gray-100 ${!shouldShowExpanded ? 'justify-center px-2' : ''
                  }`}
              >
                <User className="h-5 w-5 flex-shrink-0" />
                {shouldShowExpanded && <span>{t('profile')}</span>}
              </Button>
            </IntlLink>
          )}
          
          {/* Super Admin Links */}
          {session?.user?.isSuperAdmin && (
            <>
              {/* Schools Management */}
              <IntlLink href="/admin/schools" className="block mb-2">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start gap-2 font-medium text-[#174F7F] hover:text-[#174F7F]/90 hover:bg-gray-100 ${
                    !shouldShowExpanded ? 'justify-center px-2' : ''
                  }`}
                >
                  <Building className="h-5 w-5 flex-shrink-0" />
                  {shouldShowExpanded && <span>{t('schools')}</span>}
                </Button>
              </IntlLink>
              
              {/* User Management */}
              <IntlLink href="/admin/users" className="block mb-2">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start gap-2 font-medium text-[#174F7F] hover:text-[#174F7F]/90 hover:bg-gray-100 ${
                    !shouldShowExpanded ? 'justify-center px-2' : ''
                  }`}
                >
                  <Users className="h-5 w-5 flex-shrink-0" />
                  {shouldShowExpanded && <span>{t('users')}</span>}
                </Button>
              </IntlLink>
            </>
          )}

          {/* School Admin Links */}
          {session?.user && !session.user.isSuperAdmin && managedSchools.length > 0 && (
            <>
              {/* School Management Header */}
              <div className="mb-2">
                <Button
                  variant="ghost"
                  onClick={() => setSchoolsExpanded(!schoolsExpanded)}
                  className={`w-full justify-start gap-2 font-medium text-[#174F7F] hover:text-[#174F7F]/90 hover:bg-gray-100 ${
                    !shouldShowExpanded ? 'justify-center px-2' : ''
                  }`}
                >
                  <Building className="h-5 w-5 flex-shrink-0" />
                  {shouldShowExpanded && (
                    <>
                      <span className="flex-1 text-left">{t('mySchools')}</span>
                      {schoolsExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </>
                  )}
                </Button>
              </div>

              {/* School List */}
              {schoolsExpanded && shouldShowExpanded && (
                <div className="ml-4 space-y-1 mb-2">
                  {managedSchools.map((school) => (
                    <div key={school.id} className="space-y-1">
                      {/* School Settings */}
                      <IntlLink href={`/admin/schools/${school.id}`} className="block">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 text-sm text-gray-600 hover:text-[#174F7F] hover:bg-gray-50"
                        >
                          <Settings className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{school.name}</span>
                        </Button>
                      </IntlLink>
                      
                      {/* School Users */}
                      <IntlLink href={`/admin/schools/${school.id}/users`} className="block">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start gap-2 text-sm text-gray-600 hover:text-[#174F7F] hover:bg-gray-50 ml-2"
                        >
                          <Users className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{t('users')}</span>
                        </Button>
                      </IntlLink>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          
          {/* Mobile User Info Section - Moved to bottom */}
          {isMobile && (
            <div className="mt-auto pt-4 border-t border-gray-100">
              {session ? (
                <>
                  {/* User info */}
                  <div className="flex items-center gap-2 px-2 py-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700 truncate flex-1">
                      {session.user?.name ?? session.user?.email}
                    </span>
                  </div>
                  
                  {/* Logout button */}
                  <Button
                    variant="ghost"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full justify-start gap-2 text-[#174F7F] mt-2"
                    size="sm"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('logout')}</span>
                  </Button>
                  
                  {/* Language switcher */}
                  <div className="mt-2">
                    <LanguageSwitcher variant="mobile" />
                  </div>
                </>
              ) : (
                <>
                  {/* Login button */}
                  <IntlLink href="/login" className="block">
                    <Button 
                      className="w-full bg-[#174F7F] hover:bg-[#174F7F]/90 text-white gap-2 font-medium"
                      size="default"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>{t('login')}</span>
                    </Button>
                  </IntlLink>
                  
                  {/* Language switcher */}
                  <div className="mt-3">
                    <LanguageSwitcher variant="mobile" />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
} 