import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { AUTH_ERROR_CODES, type AuthErrorCode } from './errorCodes';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
}

export interface AuthValidationResult {
  success: boolean;
  user?: {
    id: string;
    email: string | null;
    name: string | null;
    isActive: boolean;
  };
  decoded?: JWTPayload;
  error?: string;
  errorCode?: AuthErrorCode;
  status?: number;
}

/**
 * Validates JWT token and checks user status in database
 * @param request - The NextRequest object containing authorization header
 * @param options - Configuration options for validation
 * @returns AuthValidationResult with user data or error information
 */
export async function validateMobileAuth(
  request: NextRequest,
  options: { ignoreExpiration?: boolean } = {}
): Promise<AuthValidationResult> {
  // Check authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Authorization token required',
      errorCode: AUTH_ERROR_CODES.MISSING_TOKEN,
      status: 401
    };
  }

  const token = authHeader.substring(7);

  // Verify JWT token
  let decoded: JWTPayload;
  try {
    const verifyOptions = options.ignoreExpiration ? { ignoreExpiration: true } : {};
    decoded = jwt.verify(token, JWT_SECRET, verifyOptions) as JWTPayload;
  } catch {
    return {
      success: false,
      error: options.ignoreExpiration ? 'Invalid token' : 'Invalid or expired token',
      errorCode: AUTH_ERROR_CODES.INVALID_TOKEN,
      status: 401
    };
  }

  // Validate user still exists and is active in database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      name: true,
      isActive: true,
    },
  });

  if (!user) {
    console.log(`Token validation failed: User ${decoded.userId} not found`);
    return {
      success: false,
      error: 'User account not found',
      errorCode: AUTH_ERROR_CODES.USER_NOT_FOUND,
      status: 401
    };
  }

  if (!user.isActive) {
    console.log(`Token validation failed: User ${decoded.userId} account is inactive`);
    return {
      success: false,
      error: 'Account is inactive',
      errorCode: AUTH_ERROR_CODES.ACCOUNT_INACTIVE,
      status: 401
    };
  }

  return {
    success: true,
    user,
    decoded
  };
}

/**
 * Helper function to create error responses for mobile auth failures
 * @param result - The AuthValidationResult from validateMobileAuth
 * @returns NextResponse with appropriate error message and status
 */
export function createAuthErrorResponse(result: AuthValidationResult): NextResponse {
  return NextResponse.json(
    { 
      error: result.error,
      errorCode: result.errorCode
    },
    { status: result.status ?? 500 }
  );
} 