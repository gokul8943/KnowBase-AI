import { useAuth } from './AuthContext';
import { OrganizationProvider as OrganizationProviderInner } from './OrganizationContext';

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return <OrganizationProviderInner isAuthenticated={isAuthenticated}>{children}</OrganizationProviderInner>;
}