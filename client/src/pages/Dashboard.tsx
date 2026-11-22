import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { LogOut, LayoutDashboard, Settings, User, Building2 } from 'lucide-react';
import { OrganizationSwitcher } from '../modules/organizations/components/OrganizationSwitcher';

export function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const { activeOrganization } = useOrganization();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50">
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <LayoutDashboard className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-bold">KnowBase AI</h1>
            </div>
            {activeOrganization && (
              <OrganizationSwitcher />
            )}
          </div>
          <nav className="flex items-center space-x-4">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              to="/settings"
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center space-x-1"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
            <Link
              to="/organization/members"
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center space-x-1"
            >
              <User className="h-4 w-4" />
              <span>Members</span>
            </Link>
            <Link
              to="/organization/workspace"
              className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center space-x-1"
            >
              <Building2 className="h-4 w-4" />
              <span>Workspace</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Welcome back, {user?.name}!</h2>
            <p className="text-muted-foreground mt-1">
              {activeOrganization
                ? `You're viewing ${activeOrganization.name}. Start building your knowledge base.`
                : 'No organization selected. Create one to get started.'}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your profile details and account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="mt-1">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="mt-1">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <p className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email Verified
                  </label>
                  <p className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {user?.emailVerified ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {activeOrganization && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span>Current Organization</span>
                </CardTitle>
                <CardDescription>Your active organization context</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="mt-1 font-medium">{activeOrganization.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Slug</label>
                    <p className="mt-1 font-mono text-sm">{activeOrganization.slug}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Your Role</label>
                    <p className="mt-1 capitalize">{activeOrganization.role.toLowerCase()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Workspaces</label>
                    <p className="mt-1">{activeOrganization.workspaces.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Button variant="outline" asChild>
                <Link to="/settings">
                  <User className="mr-2 h-4 w-4" />
                  Organization Settings
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/organization/members">
                  <User className="mr-2 h-4 w-4" />
                  Manage Members
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/organization/workspace">
                  <Building2 className="mr-2 h-4 w-4" />
                  Workspace Settings
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/documents">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Documents
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
