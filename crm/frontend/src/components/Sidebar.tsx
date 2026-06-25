import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
  LayoutDashboard,
  Users,
  Monitor,
  Image,
  ShoppingBag,
  Upload,
  UsersRound,
  Store,
  LogOut,
  Moon,
  Sun,
  Shield,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['gerant', 'collaborateur'] },
  { to: '/clients', icon: Users, label: 'Clients', roles: ['gerant', 'collaborateur'] },
  { to: '/miroirs', icon: Monitor, label: 'Miroirs', roles: ['gerant'] },
  { to: '/mediatheque', icon: Image, label: 'Médiathèque', roles: ['gerant'] },
  { to: '/produits', icon: ShoppingBag, label: 'Produits', roles: ['gerant', 'collaborateur'] },
  { to: '/export', icon: Upload, label: 'Export', roles: ['gerant'] },
  { to: '/rgpd', icon: Shield, label: 'RGPD', roles: ['gerant'] },
  { to: '/equipe', icon: UsersRound, label: 'Équipe', roles: ['gerant'] },
];

export default function Sidebar() {
  const { user, isGerant, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleDark } = useDarkMode();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-center">
        <img
          src="/logo-kbeauty.svg"
          alt="K Beauty Cosmetics"
          className="w-40 h-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems
          .filter((item) => isGerant || item.roles.includes('collaborateur'))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : 'text-gray-600'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admin</div>
            </div>
            <NavLink
              to="/boutiques"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : 'text-gray-600'}`}
            >
              <Store className="w-5 h-5" />
              Boutiques
            </NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleDark}
              className="p-2 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
              title={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-danger rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
