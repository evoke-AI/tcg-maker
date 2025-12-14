import { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | TCG Maker',
    default: 'TCG Maker'
  },
  description: 'Create stunning, consistent trading card artwork with AI',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        {children}
      </body>
    </html>
  )
}
