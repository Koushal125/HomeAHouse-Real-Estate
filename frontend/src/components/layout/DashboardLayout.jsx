import { Outlet } from 'react-router-dom';

// All pages embed their own InlineNavbar — no sticky Navbar, no padding wrapper
const DashboardLayout = () => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <main className="flex-1 overflow-y-auto w-full">
      <Outlet />
    </main>
  </div>
);

export default DashboardLayout;
