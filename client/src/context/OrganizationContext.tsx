import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '../modules/organizations/api/organizationApi';
import type { OrganizationResponse } from '../modules/organizations/types/organization';
import { getAccessToken } from '../utils/auth';

interface OrganizationContextType {
  activeOrganization: OrganizationResponse | null;
  organizations: OrganizationResponse[];
  isLoading: boolean;
  isFetching: boolean;
  setActiveOrganization: (org: OrganizationResponse) => void;
  refreshOrganizations: () => Promise<void>;
  createOrganization: (data: { name: string; description?: string }) => Promise<OrganizationResponse>;
  updateOrganization: (organizationId: string, data: { name?: string; description?: string | null; logoUrl?: string | null }) => Promise<OrganizationResponse>;
  deleteOrganization: (organizationId: string) => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

interface OrganizationProviderProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export function OrganizationProvider({ children, isAuthenticated }: OrganizationProviderProps) {
  const queryClient = useQueryClient();
  const [activeOrganization, setActiveOrganizationState] = useState<OrganizationResponse | null>(null);

  const { data: organizations = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationApi.list,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated && !!getAccessToken(),
  });

  const createMutation = useMutation({
    mutationFn: organizationApi.create,
    onSuccess: (newOrg) => {
      queryClient.setQueryData(['organizations'], (old: OrganizationResponse[] = []) => [...old, newOrg]);
      setActiveOrganizationState(newOrg);
      localStorage.setItem('activeOrganizationId', newOrg.id);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; description?: string | null; logoUrl?: string | null } }) =>
      organizationApi.update(id, data),
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData(['organizations'], (old: OrganizationResponse[] = []) =>
        old.map((org) => (org.id === updatedOrg.id ? updatedOrg : org))
      );
      if (activeOrganization?.id === updatedOrg.id) {
        setActiveOrganizationState(updatedOrg);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: organizationApi.delete,
    onSuccess: (_, deletedId) => {
      queryClient.setQueryData(['organizations'], (old: OrganizationResponse[] = []) =>
        old.filter((org) => org.id !== deletedId)
      );
      if (activeOrganization?.id === deletedId) {
        const remaining = queryClient.getQueryData<OrganizationResponse[]>(['organizations']) || [];
        setActiveOrganizationState(remaining[0] || null);
        localStorage.removeItem('activeOrganizationId');
      }
    },
  });

  const refreshOrganizations = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const setActiveOrganization = useCallback((org: OrganizationResponse) => {
    setActiveOrganizationState(org);
    localStorage.setItem('activeOrganizationId', org.id);
  }, []);

  const createOrganization = useCallback(
    async (data: { name: string; description?: string }) => {
      return createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const updateOrganization = useCallback(
    async (organizationId: string, data: { name?: string; description?: string | null; logoUrl?: string | null }) => {
      return updateMutation.mutateAsync({ id: organizationId, data });
    },
    [updateMutation]
  );

  const deleteOrganization = useCallback(
    async (organizationId: string) => {
      return deleteMutation.mutateAsync(organizationId);
    },
    [deleteMutation]
  );

  useEffect(() => {
    const storedOrgId = localStorage.getItem('activeOrganizationId');
    if (storedOrgId && organizations.length > 0) {
      const org = organizations.find((o) => o.id === storedOrgId);
      if (org) {
        setActiveOrganizationState(org);
      } else if (organizations[0]) {
        setActiveOrganizationState(organizations[0]);
      }
    } else if (organizations.length > 0 && !activeOrganization) {
      setActiveOrganizationState(organizations[0]);
    }
  }, [organizations, activeOrganization]);

  return (
    <OrganizationContext.Provider
      value={{
        activeOrganization,
        organizations,
        isLoading,
        isFetching,
        setActiveOrganization,
        refreshOrganizations,
        createOrganization,
        updateOrganization,
        deleteOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export const useOrganization = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};