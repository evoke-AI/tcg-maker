import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

// Create the internationalization middleware with simplified configuration
const intlMiddleware = createIntlMiddleware({
  // Define our locales
  locales: ['en', 'zh-TW'],
  // Use English as the default locale
  defaultLocale: 'en',
  // Only add the locale prefix when needed
  localePrefix: 'never'
});

// Export a combined middleware handler
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for ALL API routes and static files
  if (pathname.startsWith('/api/') || 
      pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|mp4|webm|ogg|mp3|wav|pdf|doc|docx|xls|xlsx|ppt|pptx|zip|ttf|woff|woff2)$/)) {
    return NextResponse.next();
  }
  
  // Apply internationalization middleware
  return await intlMiddleware(request);
}

// Configure specific routes to apply the middleware to
export const config = {
  matcher: [
    // Apply to all paths except Next.js specific paths and ALL API routes
    '/((?!_next|api).*)'
  ]
};
