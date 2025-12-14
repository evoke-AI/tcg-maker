/**
 * MainLayout component that provides consistent layout with navbar across pages
 * Can be configured to hide navbar for specific pages
 * Implements sticky navbar with scroll-based visibility and a responsive sidebar
 */
'use client'

import { ReactNode, useEffect, useState } from 'react'
import Navbar from '@/app/navbar'
import Sidebar from '@/app/components/Sidebar'
import { useSidebar } from '@/app/hooks/useSidebar'

interface MainLayoutProps {
  children: ReactNode
  hideNavbar?: boolean
}

export default function MainLayout({ children, hideNavbar = false }: MainLayoutProps) {
  const [prevScrollPos, setPrevScrollPos] = useState(0)
  const [visible, setVisible] = useState(true)
  const { isOpen, isMobile, toggle, open, close } = useSidebar() // Default desktop sidebar to collapsed

  useEffect(() => {
    // Handle scroll events
    const handleScroll = () => {
      const currentScrollPos = window.scrollY
      
      // Show navbar when scrolling up or at the top
      // Hide navbar when scrolling down and not at the top
      setVisible(prevScrollPos > currentScrollPos || currentScrollPos < 10)
      setPrevScrollPos(currentScrollPos)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [prevScrollPos])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      {!hideNavbar && (
        <div 
          className={`fixed w-full top-0 z-50 transition-transform duration-300 ${
            visible ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <Navbar toggleSidebar={toggle} />
        </div>
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isOpen}
        isMobile={isMobile}
        toggle={toggle}
        open={open}
        close={close}
        isNavbarVisible={!hideNavbar && visible}
      />
      
      {/* Main content */}
      <main 
        className={`
          transition-all duration-300 ease-in-out pb-5
          ${!hideNavbar ? 'pt-20' : ''}
          ${isMobile 
            ? 'mx-2' // Mobile: no left margin, sidebar overlays
            : isOpen 
              ? 'ml-72 mr-2' // Desktop expanded: full margin
              : 'ml-20 mr-2' // Desktop collapsed: small margin
          }
        `}
      >
        {children}
      </main>
    </div>
  )
} 