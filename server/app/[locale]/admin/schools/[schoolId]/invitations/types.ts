// Shared interfaces for school invitations feature

export interface SchoolInvitation {
  id: string;
  email: string;
  role: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  invitedAt: Date;
  acceptedAt?: Date | null;
  expiresAt: Date;
  invitedBy: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  acceptedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  } | null;
}

export interface CreateInvitationData {
  email: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
}

export interface InvitationFilters {
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'ALL';
  page?: number;
  limit?: number;
}

export interface School {
  id: string;
  name: string;
  code?: string | null;
  email: string;
}

export interface InvitationsPageProps {
  school: School;
}

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
} 