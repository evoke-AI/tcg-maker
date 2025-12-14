import { type NextAuthOptions, DefaultSession } from "next-auth"
// import { JWT } from "next-auth/jwt" // Removed unused import
import { prisma } from "@/lib/prisma"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { SYSTEM_ROLES } from "@/lib/constants"
import { parseLoginIdentifier, computeHKName } from "@/lib/authUtils"
import { Prisma } from "@prisma/client"

// Define the shape of the user object returned by authorize and used in callbacks
// This helps TypeScript understand the fields we are adding.
interface ExtendedUser { 
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isActive: boolean;
}

declare module "next-auth" {
  // Extend session to include id, isActive, and isSuperAdmin
  interface Session {
    user: {
      id: string;
      isActive: boolean;
      isSuperAdmin?: boolean; // Super admin flag
    } & DefaultSession["user"]
  }
  // Optional: If you need to refer to the user object shape within NextAuth context elsewhere
  // interface User extends ExtendedUser {}
}

declare module "next-auth/jwt" {
  // Extend JWT to include id, isActive, and isSuperAdmin
  interface JWT {
    id: string;
    isActive: boolean;
    isSuperAdmin?: boolean; // Super admin flag
    name?: string | null;
    email?: string | null;
    picture?: string | null;
    sub?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        identifier: { label: "Username or Email", type: "text", placeholder: "username@school.edu or email@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials): Promise<ExtendedUser | null> { // Return our extended user type
        try {
          if (!credentials?.identifier || !credentials?.password) {
            throw new Error("Missing credentials")
          }

          // Parse the new username@school-email format
          const parsedLogin = parseLoginIdentifier(credentials.identifier);
          
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
              throw new Error("Invalid credentials");
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
            userQuery = {
              OR: [
                { email: credentials.identifier },
                // Add username condition if identifier doesn't contain @ (likely a username)
                ...(credentials.identifier.includes('@') ? [] : [{ username: credentials.identifier }]),
              ],
              isActive: true,
            };
          }

          const user = await prisma.user.findFirst({
            where: userQuery,
            // Select all fields needed for the ExtendedUser type
            select: {
              id: true,
              email: true,
              username: true,
              name: true,
              firstName: true,
              lastName: true,
              password: true,
              isActive: true 
            }
          })

          if (!user || !user.password) {
            console.log("Invalid credentials: User not found or no password.");
            throw new Error("Invalid credentials")
          }

          if (!user.isActive) {
            console.log(`Inactive account login attempt: ${user.email || user.username}`);
            throw new Error("Account is inactive")
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)

          if (!isValid) {
            console.log(`Invalid password attempt for user: ${user.email || user.username}`);
            throw new Error("Invalid credentials")
          }

          // Compute HK-style name if not already set
          const displayName = user.name || computeHKName(user.firstName, user.lastName) || user.username || user.email || 'User';
          
          // Explicitly return the ExtendedUser shape
          return {
            id: user.id,
            email: user.email,
            name: displayName,
            isActive: user.isActive
          }
        } catch (error) {
          // Log the error server-side but throw a generic or specific message
          console.error('Authorize error:', error instanceof Error ? error.message : error);
          throw new Error(error instanceof Error ? error.message : "Authentication failed");
        }
      }
    })
  ],
  callbacks: {
    // `user` object here is the one returned from `authorize`
    async jwt({ token, user, trigger, session }) {
      // Initial sign-in: Transfer authorize result (ExtendedUser) to token
      if (user) {
        const u = user as ExtendedUser; // Cast to our defined type
        token.id = u.id;
        token.isActive = u.isActive;
        token.name = u.name;
        token.email = u.email;
        // Check if user has SUPER_ADMIN role
        const userWithRole = await prisma.user.findUnique({
          where: { id: u.id },
          select: {
            systemRole: true
          }
        });
        token.isSuperAdmin = userWithRole?.systemRole === SYSTEM_ROLES.SUPER_ADMIN;
      }

      // Subsequent calls or updates: Refresh isActive and canAccessAdmin
      if (token.id && (!user || trigger === "update" || trigger === "signIn")) { 
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: { 
              isActive: true,
              systemRole: true
            }
          });

          if (freshUser) {
            token.isActive = freshUser.isActive;
            // Re-check super admin role if user is still active
            if (token.isActive) {
              token.isSuperAdmin = freshUser.systemRole === SYSTEM_ROLES.SUPER_ADMIN;
            } else {
              token.isSuperAdmin = false;
            }
            
            console.log(`Refreshed token for user ${token.id}: isActive=${token.isActive}, isSuperAdmin=${token.isSuperAdmin}`);

            // If session update was triggered, merge data
            if (trigger === "update" && session) {
                // Be careful what you merge from session - only merge intended updates
                // Example: token.name = session.user.name ?? token.name;
                token = { ...token, ...session }; // Use with caution
            }
          } else {
            // User doesn't exist anymore - return minimal token to trigger session invalidation
            console.log(`User ${token.id} not found during token refresh. Returning minimal token.`);
            // Return a minimal token that will cause session to be considered invalid
            return {
              // Keep minimal required properties but mark as invalid
              id: '',
              isActive: false,
              isSuperAdmin: false
            };
          }
        } catch (error) {
            console.error(`Error refreshing token data for user ${token.id}:`, error);
            token.isActive = false; 
            token.isSuperAdmin = false;
        }
      }

      return token; // Return the potentially updated token
    },
    // `token` object here is the one returned from `jwt` callback
    async session({ session, token }) {
      // If token has no user ID (user was deleted), create an invalid session
      if (!token.id || token.id === '') {
        console.log('Session callback: Creating invalid session due to empty token ID');
        // Return a session that indicates the user is invalid
        return {
          ...session,
          user: {
            ...session.user,
            id: '', // Empty ID indicates invalid session
            isActive: false,
            isSuperAdmin: false,
          }
        };
      }
      
      // Transfer necessary fields from the (potentially updated) token to the session
      session.user.id = token.id;
      session.user.isActive = token.isActive;
      session.user.isSuperAdmin = token.isSuperAdmin ?? false;
      // Add other fields from token if needed in the client-side session
      return session;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect to login on auth errors (like inactive account)
  },
  debug: process.env.NODE_ENV === 'development',
}
