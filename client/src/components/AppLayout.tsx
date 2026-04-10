import { useEffect, useState, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useSyncStore } from '../stores/syncStore';
import { useGroupStore } from '../stores/groupStore';
import {
  LayoutDashboard, Calendar, ListTodo, StickyNote, BookOpen,
  Timer, Users, Settings, LogOut, Menu, Search, Cloud, CloudOff, Bell, Check, X
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/calendar', icon: Calendar, label: 'Takvim' },
  { path: '/tasks', icon: ListTodo, label: 'Görevler' },
  { path: '/notes', icon: StickyNote, label: 'Notlar' },
  { path: '/journal', icon: BookOpen, label: 'Günlük' },
  { path: '/countdowns', icon: Timer, label: 'Geri Sayımlar' },
  { path: '/groups', icon: Users, label: 'Gruplar' },
  { path: '/settings', icon: Settings, label: 'Ayarlar' },
];

export default function AppLayout() {
  const location = useLocation();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { syncEnabled, isOnline, lastSyncedAt, fetchStatus } = useSyncStore();
  const { pendingInvitations, fetchMyInvitations, acceptInvitation, rejectInvitation, fetchGroups } = useGroupStore();

  useEffect(() => {
    fetchStatus();
    fetchMyInvitations();
    const interval = setInterval(() => { fetchStatus(); fetchMyInvitations(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAccept = async (invitationId: string) => {
    try {
      await acceptInvitation(invitationId);
      await fetchGroups();
      toast.success('Davet kabul edildi');
    } catch {
      toast.error('Davet kabul edilemedi');
    }
  };

  const handleReject = async (invitationId: string) => {
    try {
      await rejectInvitation(invitationId);
      toast.success('Davet reddedildi');
    } catch {
      toast.error('Davet reddedilemedi');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-100 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col`}>
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-color)' }}>
            Ajandam
          </h1>
          {user && <p className="text-sm text-gray-500 mt-1">{user.fullName}</p>}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
                style={isActive ? { backgroundColor: 'var(--theme-color)' } : undefined}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          {/* Sync status */}
          {syncEnabled && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-500">
              {isOnline ? (
                <>
                  <Cloud size={14} className="text-green-500" />
                  <span className="text-green-600">Senkronize</span>
                </>
              ) : (
                <>
                  <CloudOff size={14} className="text-orange-400" />
                  <span className="text-orange-500">Çevrimdışı</span>
                </>
              )}
              {lastSyncedAt && (
                <span className="ml-auto text-gray-400">
                  {new Date(lastSyncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          )}

          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut size={20} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <Bell size={20} />
              {pendingInvitations.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] rounded-full text-[10px] text-white flex items-center justify-center"
                  style={{ backgroundColor: 'var(--theme-color)' }}>
                  {pendingInvitations.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-100 shadow-lg z-50 animate-fade-in">
                <div className="p-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Bildirimler</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {pendingInvitations.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-400">Bildirim yok</div>
                  ) : (
                    pendingInvitations.map((inv) => (
                      <div key={inv.id} className="p-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-start gap-2">
                          <Users size={16} className="text-[var(--theme-color)] mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">{inv.invitedByName}</span> sizi{' '}
                              <span className="font-medium">{inv.groupName}</span> grubuna davet etti
                            </p>
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => handleAccept(inv.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white hover:opacity-90"
                                style={{ backgroundColor: 'var(--theme-color)' }}>
                                <Check size={12} /> Kabul Et
                              </button>
                              <button onClick={() => handleReject(inv.id)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50">
                                <X size={12} /> Reddet
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/search"
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <Search size={20} />
          </Link>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
