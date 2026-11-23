import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:pl-72 transition-all duration-200">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="container-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}