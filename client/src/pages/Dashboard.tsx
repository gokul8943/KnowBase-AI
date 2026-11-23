import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { useQuery } from '@tanstack/react-query';
import { organizationApi } from '../modules/organizations/api/organizationApi';
import { workspaceApi } from '../modules/workspaces/api/workspaceApi';
import { Button } from '../components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { EmptyState } from '../components/ui/empty-state';
import { PageHeader } from '../components/layout/PageHeader';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { LogOut, Users, Building2, Settings, Sparkles, Plus, BarChart2, Shield } from 'lucide-react';
import { format } from 'date-fns';

export function Dashboard() {
  const { logout } = useAuth();
  const { activeOrganization } = useOrganization();
  const navigate = useNavigate();

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', activeOrganization?.id],
    queryFn: () => organizationApi.listMembers(activeOrganization!.id),
    enabled: !!activeOrganization,
  });

  const { data: workspaces = [], isLoading: workspacesLoading } = useQuery({
    queryKey: ['workspaces', activeOrganization?.id],
    queryFn: () => workspaceApi.list(activeOrganization!.id),
    enabled: !!activeOrganization,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const stats = [
    {
      name: 'Members',
      value: members.length,
      icon: Users,
      href: '/organization/members',
      loading: membersLoading,
    },
    {
      name: 'Workspaces',
      value: workspaces.length,
      icon: Building2,
      href: '/organization/workspace',
      loading: workspacesLoading,
    },
  ];

  const quickActions = [
    { name: 'Manage Members', href: '/organization/members', icon: Users },
    { name: 'Workspace Settings', href: '/organization/workspace', icon: Building2 },
    { name: 'Organization Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back, {user?.name}. Here&apos;s an overview of your organization."
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Dashboard', current: true },
            ]}
          />
        }
      />

      {activeOrganization ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.name}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground truncate">{stat.name}</p>
                      {stat.loading ? (
                        <div className="h-8 w-24 mt-1 animate-pulse bg-muted rounded" />
                      ) : (
                        <p className="text-3xl font-semibold mt-1">{stat.value}</p>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Quick Actions</span>
                </CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.name}
                    variant="glass"
                    asChild
                    className="h-auto py-3 justify-start gap-3"
                  >
                    <Link to={action.href}>
                      <action.icon className="h-5 w-5 flex-shrink-0" />
                      <span>{action.name}</span>
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>Current Organization</span>
                </CardTitle>
                <CardDescription>Your active organization context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                    <dd className="mt-1 font-medium">{activeOrganization.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Slug</dt>
                    <dd className="mt-1 font-mono text-sm">{activeOrganization.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Your Role</dt>
                    <dd className="mt-1 flex items-center space-x-2">
                      <Badge variant="secondary" className="gap-1.5">
                        {activeOrganization.role === 'OWNER' && <Shield className="h-3 w-3" />}
                        {activeOrganization.role}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                    <dd className="mt-1">{format(new Date(activeOrganization.createdAt), 'PPP')}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription>Latest updates in your organization</CardDescription>
              </CardHeader>
              <CardContent>
                <EmptyState
                  icon={<BarChart2 className="h-6 w-6 text-muted-foreground" />}
                  title="No recent activity"
                  description="Activity will appear here as you and your team use KnowBase AI."
                />
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center space-x-2">
                  <LogOut className="h-5 w-5" />
                  <span>Danger Zone</span>
                </CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="glass" onClick={handleLogout} className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader className="text-center py-12">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>No Organization Selected</CardTitle>
            <CardDescription className="mt-2">
              Create an organization or switch to an existing one to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-0">
            <Button variant="glass" asChild>
              <Link to="/onboarding">
                <Plus className="mr-2 h-4 w-4" />
                Create Organization
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}