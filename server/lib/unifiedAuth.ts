import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { validateMobileAuth } from './mobileAuth';
import { prisma } from './prisma';

export interface UnifiedAuthResult {
  success: boolean;
  userId?: string;
  user?: {
    id: string;
    email: string | null;
    name: string | null;
    isActive: boolean;
  };
  error?: string;
  status?: number;
}

/**
 * Unified authentication that supports both NextAuth sessions (web) and JWT tokens (mobile)
 * This allows server actions to work with both authentication methods
 */
export async function validateUnifiedAuth(request?: NextRequest): Promise<UnifiedAuthResult> {
  // Try NextAuth session first (for web requests)
  try {
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      // Validate user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'User account not found',
          status: 401
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is inactive',
          status: 401
        };
      }

      return {
        success: true,
        userId: user.id,
        user
      };
    }
  } catch (error) {
    console.error('NextAuth session validation error:', error);
  }

  // If no NextAuth session and we have a request object, try mobile JWT auth
  if (request) {
    try {
      const mobileAuthResult = await validateMobileAuth(request);
      
      if (mobileAuthResult.success && mobileAuthResult.user) {
        return {
          success: true,
          userId: mobileAuthResult.user.id,
          user: mobileAuthResult.user
        };
      }

      // Return mobile auth error if it failed
      return {
        success: false,
        error: mobileAuthResult.error,
        status: mobileAuthResult.status
      };
    } catch (error) {
      console.error('Mobile auth validation error:', error);
    }
  }

  // No valid authentication found
  return {
    success: false,
    error: 'Authentication required',
    status: 401
  };
}

/**
 * Requires unified authentication and returns the authenticated user's ID.
 * Works with both NextAuth sessions and mobile JWT tokens.
 * 
 * @param request - Optional NextRequest for mobile JWT validation
 * @returns Promise<{ userId: string }> - The user ID if authenticated
 * @throws Error - If authentication fails
 */
export async function requireUnifiedAuth(request?: NextRequest): Promise<{ userId: string }> {
  const authResult = await validateUnifiedAuth(request);
  
  if (!authResult.success) {
    throw new Error(authResult.error || 'Authentication failed');
  }

  return { userId: authResult.userId! };
}

/**
 * Context object to pass request information to server actions
 * This allows server actions to access the request for mobile auth validation
 */
export interface AuthContext {
  request?: NextRequest;
}

/**
 * Helper to create auth context from request
 */
export function createAuthContext(request?: NextRequest): AuthContext {
  return { request };
} 