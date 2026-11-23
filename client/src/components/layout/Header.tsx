import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { LogOut, Bell } from 'lucide-react';
import { cn } from '../../utils/cn';

interface HeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export function Header({ children, className }: HeaderProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className={cn('sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border lg:ml-72', className)}>
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4 lg:hidden">
          <span className="text-lg font-semibold text-foreground">KnowBase AI</span>
        </div>

        <div className="flex-1 lg:flex-none">
          {children}
        </div>

        <nav className="flex items-center space-x-2" aria-label="User actions">
          <Button
            variant="glass"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          <div className="hidden sm:flex items-center space-x-3 px-3 py-1.5 rounded-md bg-accent">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <Button variant="glass" size="icon" onClick={handleLogout} aria-label="Log out">
            <LogOut className="h-5 w-5" />
          </Button>
        </nav>
      </div>
    </header>
  );
}