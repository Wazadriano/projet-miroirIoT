import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useDarkMode } from '@/hooks/useDarkMode';
import {
    LayoutDashboard,
    Users,
    Monitor,
    ShoppingBag,
    MoreHorizontal,
    Image,
    Upload,
    UsersRound,
    Store,
    LogOut,
    Moon,
    Sun,
    X,
    Shield,
} from 'lucide-react';

export default function BottomNav() {
    const { user, isGerant, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const { isDark, toggleDark } = useDarkMode();
    const [moreOpen, setMoreOpen] = useState(false);

    const handleLogout = async () => {
        setMoreOpen(false);
        await logout();
        navigate('/login');
    };

    // Primary tabs (always visible) — max 4 + More
    const primaryTabs = [
        { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { to: '/clients', icon: Users, label: 'Clients' },
        { to: '/produits', icon: ShoppingBag, label: 'Produits' },
        ...(isGerant ? [{ to: '/miroirs', icon: Monitor, label: 'Miroirs' }] : []),
    ];

    // Secondary items shown in the "Plus" drawer
    const moreItems = [
        ...(isGerant ? [
            { to: '/mediatheque', icon: Image, label: 'Médiathèque' },
            { to: '/export', icon: Upload, label: 'Export' }, { to: '/rgpd', icon: Shield, label: 'RGPD' }, { to: '/equipe', icon: UsersRound, label: 'Équipe' },
        ] : []),
        ...(isAdmin ? [{ to: '/boutiques', icon: Store, label: 'Boutiques' }] : []),
    ];

    return (
        <>
            {/* Drawer overlay */}
            {moreOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
                    onClick={() => setMoreOpen(false)}
                />
            )}

            {/* More drawer — slides up from bottom */}
            {moreOpen && (
                <div className="fixed bottom-16 left-0 right-0 z-50 mx-3 rounded-2xl border border-gray-200 bg-white shadow-2xl lg:hidden mb-8"
                    style={{ borderColor: isDark ? '#2e2220' : undefined, backgroundColor: isDark ? '#161110' : undefined }}
                >
                    {/* User info + actions */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
                        style={{ borderColor: isDark ? '#2e2220' : undefined }}
                    >
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
                            <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={toggleDark}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                                title={isDark ? 'Mode clair' : 'Mode sombre'}
                            >
                                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setMoreOpen(false)}
                                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Extra nav items */}
                    <div className="p-2 grid grid-cols-3 gap-1">
                        {moreItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setMoreOpen(false)}
                                className={({ isActive }) =>
                                    `flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-colors ${isActive
                                        ? 'bg-primary/10 text-primary-deeper'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`
                                }
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            )}

            {/* Bottom tab bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white lg:hidden"
                style={{ borderColor: isDark ? '#2e2220' : undefined, backgroundColor: isDark ? '#161110' : undefined }}
            >
                <div className="flex h-16 items-stretch">
                    {primaryTabs.map((tab) => (
                        <NavLink
                            key={tab.to}
                            to={tab.to}
                            end={tab.to === '/'}
                            className={({ isActive }) =>
                                `flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${isActive
                                    ? 'text-primary-deeper'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <tab.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                                    <span>{tab.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}

                    {/* More button */}
                    <button
                        onClick={() => setMoreOpen((s) => !s)}
                        className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${moreOpen ? 'text-primary-deeper' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <MoreHorizontal className="w-5 h-5" />
                        <span>Plus</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
