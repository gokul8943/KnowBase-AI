import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border">
          <div className="container-page h-16 flex items-center justify-between">
            <Link to="/login" className="flex items-center space-x-2" aria-label="KnowBase AI Home">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">KnowBase AI</span>
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
        <footer className="border-t border-border py-4">
          <div className="container-page text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} KnowBase AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}