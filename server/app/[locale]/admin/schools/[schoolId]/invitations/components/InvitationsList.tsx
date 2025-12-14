'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  Mail, RefreshCw, X, Loader2, Users, Filter, Calendar, User, AlertCircle
} from 'lucide-react';
import { useInvitationUtils } from '../utils';
import type { SchoolInvitation, InvitationFilters } from '../types';

interface InvitationsListProps {
  invitations: SchoolInvitation[];
  totalInvitations: number;
  filters: InvitationFilters;
  isLoading: boolean;
  loadingActions: Record<string, boolean>;
  onFiltersChange: (filters: Partial<InvitationFilters>) => void;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onResendInvitation: (invitationId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export default function InvitationsList({
  invitations,
  totalInvitations,
  filters,
  isLoading,
  loadingActions,
  onFiltersChange,
  onCancelInvitation,
  onResendInvitation,
  onRefresh,
}: InvitationsListProps) {
  const t = useTranslations('admin.invitations');
  const {
    getStatusBadge,
    getRoleBadge,
    getExpiryText,
    getStatusFilterOptions,
    formatDate,
  } = useInvitationUtils();

  const statusOptions = getStatusFilterOptions();

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-semibold">
            {t('list.title')} ({totalInvitations})
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select
              value={filters.status || 'ALL'}
                             onValueChange={(value) => 
                 onFiltersChange({ 
                   status: value === 'ALL' ? undefined : value as 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED',
                   page: 1 
                 })
               }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('list.refresh')}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && invitations.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('list.loading')}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && invitations.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              {t('list.empty.title')}
            </h3>
            <p className="text-sm text-muted-foreground text-center">
              {t('list.empty.description')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invitations List */}
      {invitations.length > 0 && (
        <div className="space-y-4">
          {invitations.map((invitation) => (
            <Card key={invitation.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{invitation.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getRoleBadge(invitation.role)}
                      {getStatusBadge(invitation.status, invitation.expiresAt)}
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {invitation.status === 'PENDING' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onResendInvitation(invitation.id)}
                          disabled={loadingActions[invitation.id]}
                          className="flex items-center gap-1"
                        >
                          {loadingActions[invitation.id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                          {t('list.actions.resend')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onCancelInvitation(invitation.id)}
                          disabled={loadingActions[invitation.id]}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          {loadingActions[invitation.id] ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {t('list.actions.cancel')}
                        </Button>
                      </>
                    )}
                    
                    {invitation.status === 'EXPIRED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onResendInvitation(invitation.id)}
                        disabled={loadingActions[invitation.id]}
                        className="flex items-center gap-1"
                      >
                        {loadingActions[invitation.id] ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        {t('list.actions.resend')}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  {/* Invited by */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>
                      {t('list.invitedBy')}: {invitation.invitedBy.firstName} {invitation.invitedBy.lastName}
                    </span>
                  </div>
                  
                  {/* Invited date */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {t('list.invitedAt')}: {formatDate(invitation.invitedAt)}
                    </span>
                  </div>
                  
                  {/* Expiry info for pending invitations */}
                  {invitation.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>
                        {getExpiryText(invitation.expiresAt, invitation.status)}
                      </span>
                    </div>
                  )}
                  
                  {/* Accepted info */}
                  {invitation.status === 'ACCEPTED' && invitation.acceptedBy && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>
                        {t('list.acceptedBy')}: {invitation.acceptedBy.firstName} {invitation.acceptedBy.lastName}
                      </span>
                    </div>
                  )}
                  
                  {/* Accepted date */}
                  {invitation.status === 'ACCEPTED' && invitation.acceptedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {t('list.acceptedAt')}: {formatDate(invitation.acceptedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination could be added here if needed */}
    </div>
  );
} 