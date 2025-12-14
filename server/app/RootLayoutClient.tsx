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

  return (
    <SessionProvider>
      <MainLayout hideNavbar={shouldHideNavbar}>
        {children}
      </MainLayout>
    </SessionProvider>
  )
} 