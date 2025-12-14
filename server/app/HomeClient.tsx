'use client'

import { Button } from "@/components/ui/button"
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import PageContainer from '@/app/components/PageContainer'

export default function HomeClient() {
  const { data: session, status } = useSession()
  const commonT = useTranslations('common')
  const homeT = useTranslations('homePage')

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <svg className="animate-spin h-10 w-10 text-[#174F7F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg text-gray-600">{commonT('loading')}</span>
        </div>
      </div>
    )
  }

  if (session) {
    // Dashboard content for authenticated users using PageContainer
    const user = session.user
    
    return (
      <PageContainer
        title="Dashboard"
        description="Welcome to your dashboard"
      >
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="text-gray-500 w-24">Name:</span>
                <span className="text-gray-900">{user?.name ?? 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 w-24">Email:</span>
                <span className="text-gray-900">{user?.email}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Button 
                variant="secondary" 
                className="h-auto py-4 px-4 flex flex-col items-start text-left"
              >
                <h4 className="text-base font-medium text-gray-900">Action 1</h4>
                <p className="text-sm text-gray-500 mt-1">Description of action 1</p>
              </Button>
              <Button 
                variant="secondary" 
                className="h-auto py-4 px-4 flex flex-col items-start text-left"
              >
                <h4 className="text-base font-medium text-gray-900">Action 2</h4>
                <p className="text-sm text-gray-500 mt-1">Description of action 2</p>
              </Button>
              <Button 
                variant="secondary" 
                className="h-auto py-4 px-4 flex flex-col items-start text-left"
              >
                <h4 className="text-base font-medium text-gray-900">Action 3</h4>
                <p className="text-sm text-gray-500 mt-1">Description of action 3</p>
              </Button>
            </div>
          </div>
        </div>
      </PageContainer>
    )
  }

  // Landing page content for non-authenticated users
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center">
          <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
            {homeT('title')}
          </h1>
          <p className="mb-8 max-w-2xl text-xl text-slate-600">
            {homeT('description')}
          </p>
          <Link href="/login">
            <Button size="lg" className="font-semibold">
              {homeT('getStarted')}
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
} 