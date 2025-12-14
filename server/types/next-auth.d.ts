import 'next-auth'
import { DefaultSession } from "next-auth";

declare module 'next-auth' {
  interface User {
    id: string;
    isActive: boolean;
  }
  
  interface Session {
    user: {
      id: string;
      isActive: boolean;
      isSuperAdmin?: boolean;
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isActive: boolean;
    isSuperAdmin?: boolean;
  }
} 