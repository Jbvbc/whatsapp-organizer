import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { get as apiGet, post as apiPost, put as apiPut, del as apiDel } from '../services/api';

export interface Organization {
  id: string;
  name: string;
  color: string;
  description: string;
}

interface OrganizationContextType {
  organizations: Organization[];
  selectedOrg: Organization | null;
  loading: boolean;
  selectOrg: (org: Organization | null) => void;
  createOrg: (name: string, color?: string, description?: string) => Promise<Organization>;
  updateOrg: (id: string, data: Partial<Organization>) => Promise<void>;
  deleteOrg: (id: string) => Promise<void>;
  refreshOrgs: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organizations: [],
  selectedOrg: null,
  loading: false,
  selectOrg: () => {},
  createOrg: async () => ({} as Organization),
  updateOrg: async () => {},
  deleteOrg: async () => {},
  refreshOrgs: async () => {},
});

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshOrgs = async () => {
    setLoading(true);
    try {
      const { data } = await apiGet<any[]>('/api/organizations');
      setOrganizations(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshOrgs();
  }, []);

  const selectOrg = (org: Organization | null) => {
    setSelectedOrg(org);
  };

  const createOrg = async (name: string, color?: string, description?: string) => {
    const { data } = await apiPost<any>('/api/organizations', { name, color, description });
    await refreshOrgs();
    return data;
  };

  const updateOrg = async (id: string, data: Partial<Organization>) => {
    await apiPut(`/api/organizations/${id}`, data);
    await refreshOrgs();
  };

  const deleteOrg = async (id: string) => {
    await apiDel(`/api/organizations/${id}`);
    if (selectedOrg?.id === id) setSelectedOrg(null);
    await refreshOrgs();
  };

  return (
    <OrganizationContext.Provider value={{
      organizations, selectedOrg, loading,
      selectOrg, createOrg, updateOrg, deleteOrg, refreshOrgs
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  return useContext(OrganizationContext);
}
