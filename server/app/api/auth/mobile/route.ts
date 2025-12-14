'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AUTH_ERROR_CODES } from '@/lib/errorCodes';
import { parseLoginIdentifier, computeHKName } from '@/lib/authUtils';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export async function POST(request: NextRequest) {
  const { identifier, password, schoolCode } = await request.json();

  if (!identifier || !password) {
    return NextResponse.json(
      { 
        error: 'Login identifier and password are required',
        errorCode: AUTH_ERROR_CODES.MISSING_CREDENTIALS
      },
      { status: 400 }
    );
  }

  try {
    // Parse the new username@school-email format
    const parsedLogin = parseLoginIdentifier(identifier);
    
    let userQuery: Prisma.UserWhereInput;
    
    if (parsedLogin) {
      // New format: username@school-domain
      const { username, schoolEmail: schoolDomain } = parsedLogin;
      
      // Find schools where the domain part of their contact email matches
      const schoolsWithDomain = await prisma.school.findMany({
        where: {
          isActive: true,
          email: {
            endsWith: schoolDomain,
          },
        },
        select: { id: true },
      });

      if (schoolsWithDomain.length === 0) {
        return NextResponse.json(
          { 
            error: 'Invalid login credentials',
            errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS
          },
          { status: 401 }
        );
      }

      userQuery = {
        username: username,
        isActive: true,
        schoolMemberships: {
          some: {
            schoolId: {
              in: schoolsWithDomain.map(s => s.id),
            },
            isActive: true,
          },
        },
      };
    } else {
      // Legacy format: support both email and username login
      const baseQuery: Prisma.UserWhereInput = {
        OR: [
          { email: identifier },
          // Add username condition if identifier doesn't contain @ (likely a username)
          ...(identifier.includes('@') ? [] : [{ username: identifier }]),
        ],
        isActive: true,
      };

      userQuery = baseQuery;

      // If schoolCode is provided for legacy format, filter users by school membership
      if (schoolCode) {
        userQuery.schoolMemberships = {
          some: {
            school: {
              code: schoolCode,
            },
            isActive: true,
          },
        };
      }
    }

    // Find user in database
    const user = await prisma.user.findFirst({
      where: userQuery,
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        firstName: true,
        lastName: true,
        password: true,
        isActive: true,
        systemRole: true,
        schoolMemberships: {
          where: {
            isActive: true,
          },
          select: {
            role: true,
            school: {
              select: {
                id: true,
                name: true,
                code: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { 
          error: 'Invalid login credentials',
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS
        },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { 
          error: 'Invalid login credentials',
          errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS
        },
        { status: 401 }
      );
    }

    // Compute HK-style name if not already set
    const displayName = user.name || computeHKName(user.firstName, user.lastName) || user.username || user.email || 'User';

    // Create JWT payload
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: displayName,
      systemRole: user.systemRole,
      schools: user.schoolMemberships.map(membership => ({
        id: membership.school.id,
        name: membership.school.name,
        code: membership.school.code,
        email: membership.school.email,
        role: membership.role,
      })),
    };

    // Generate JWT token (30 days expiration)
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: displayName,
        systemRole: user.systemRole,
        schools: payload.schools,
      },
    });

  } catch (error) {
    console.error('Mobile auth error:', error);
    return NextResponse.json(
      { 
        error: 'Authentication failed',
        errorCode: AUTH_ERROR_CODES.INVALID_CREDENTIALS
      },
      { status: 500 }
    );
  }
} 