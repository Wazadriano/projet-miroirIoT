import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-4 pb-20 lg:p-8 lg:pb-8">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
