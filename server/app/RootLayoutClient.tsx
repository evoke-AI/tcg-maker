'use client'

import "./globals.css"
import { SessionProvider } from "next-auth/react"
import MainLayout from "./components/MainLayout"
import { usePathname } from 'next/navigation'

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  // Add paths where navbar should be hidden
  const hideNavbarPaths = ['/login']
  const shouldHideNavbar = hideNavbarPaths.includes(pathname)
  
  // Full-screen pages that bypass MainLayout entirely
  const fullScreenPaths = ['/', '/en', '/zh-TW']
  const isFullScreenPage = fullScreenPaths.includes(pathname)

  if (isFullScreenPage) {
    return (
      <SessionProvider>
        {children}
      </SessionProvider>
    )
  }

  return (
    <SessionProvider>
      <MainLayout hideNavbar={shouldHideNavbar}>
        {children}
      </MainLayout>
    </SessionProvider>
  )
} 