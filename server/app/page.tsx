import { redirect } from 'next/navigation'

// Root page simply redirects to the home page, 
// middleware will handle locale detection and redirection
export default function RootPage() {
  // The middleware will handle adding the locale
  redirect('/en')
}
