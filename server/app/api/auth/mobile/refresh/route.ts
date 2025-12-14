'use server';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { validateMobileAuth, createAuthErrorResponse } from '@/lib/mobileAuth';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export async function POST(request: NextRequest) {
  // Validate authentication and user status (allow expired tokens for refresh)
  const authResult = await validateMobileAuth(request, { ignoreExpiration: true });
  
  if (!authResult.success) {
    return createAuthErrorResponse(authResult);
  }

  const { user } = authResult;

  // Generate new JWT token with fresh expiration
  const newToken = jwt.sign(
    {
      userId: user!.id,
      email: user!.email,
      name: user!.name,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return NextResponse.json({
    success: true,
    token: newToken,
    user: {
      id: user!.id,
      email: user!.email,
      name: user!.name,
    },
  });
} 