'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { signIn, useSession } from "next-auth/react"
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'

function LoginForm() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status, data: session } = useSession()
  const t = useTranslations('loginPage')
  const commonT = useTranslations('common')

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id && session.user.id !== '') {
      // Only redirect if we have a valid session with a real user ID
      const from = searchParams.get('from')
      router.push(from ?? '/')
      router.refresh()
    } else if (status === 'authenticated' && (!session?.user?.id || session.user.id === '')) {
      // If we have an authenticated session but no valid user ID, sign out
      console.log('LoginClient: Invalid session detected, signing out');
      router.push('/api/auth/signout?callbackUrl=/login');
    }
  }, [status, session, router, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      // Don't redirect here, let the useEffect handle it
      // This ensures the session is properly updated first
    } catch (err) {
      setError(err instanceof Error ? err.message : commonT('error'))
      setIsLoading(false)
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="identifier" className="sr-only">
            {t('identifier')}
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            disabled={isLoading}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-[#174F7F] focus:border-[#174F7F] focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={t('identifier')}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            {t('password')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            disabled={isLoading}
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-[#174F7F] focus:border-[#174F7F] focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center">{error}</div>
      )}

      <div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {commonT('loading')}
            </span>
          ) : (
            t('submit')
          )}
        </Button>
      </div>
      <div className="text-center">
        <Link 
          href="/"
          className="text-sm text-[#174F7F] hover:text-[#123d63]"
        >
          ← {t('navigation.home')}
        </Link>
      </div>
    </form>
  )
}

export default function LoginClient() {
  const t = useTranslations('loginPage')
  const commonT = useTranslations('common')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex flex-col items-center">
          <Link href="/" className="mb-6">
            <Image
              src="/logo.png"
              alt="evoke AI logo"
              width={200}
              height={64}
              className="h-16 w-auto"
              priority
            />
          </Link>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            {t('title')}
          </h2>
        </div>
        <Suspense fallback={<div>{commonT('loading')}</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
} 