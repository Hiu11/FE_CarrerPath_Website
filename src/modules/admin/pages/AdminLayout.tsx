import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Route, BookOpen, FileText, BarChart3, Settings, HelpCircle, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { authApi } from '@/modules/auth/api/auth.api';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Career Paths', path: '/admin/career-paths', icon: Route },
  { name: 'Skill Library', path: '/admin/skills', icon: BookOpen },
  { name: 'Resources', path: '/admin/resources', icon: FileText },
  { name: 'Users Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export const AdminLayout = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const response = await authApi.getMe();
        setUser(response.data);
      } catch (error) {
        console.error('Failed to load user info', error);
      }
    };
    fetchMe();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans transition-colors duration-200">
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col text-sidebar-foreground">
        {/* Logo Section */}
        <div className="p-6 pb-2">
          <h1 className="text-xl font-bold text-primary">DevPath Admin</h1>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">Institutional Portal</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                twMerge(
                  clsx(
                    'group flex items-center rounded-lg px-4 py-3 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )
                )
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}

          <div className="pt-6">
            <NavLink
              to="/admin/career-paths/new"
              className="flex items-center justify-center w-full rounded-lg px-4 py-3 text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Career Path
            </NavLink>
          </div>
        </nav>

        {/* Footer Navigation */}
        <div className="px-4 py-4 space-y-1 border-t border-sidebar-border">
          <NavLink to="/admin/settings" className="group flex items-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Settings className="mr-3 h-4 w-4" /> Settings
          </NavLink>
          <NavLink to="/admin/support" className="group flex items-center rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <HelpCircle className="mr-3 h-4 w-4" /> Support
          </NavLink>
          <div className="px-4 py-2 flex items-center justify-between border-t border-sidebar-border/30 mt-2 pt-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Interface Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-sidebar-border">
          <div
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          >
            <img
              src={user?.avatarUrl || "https://i.pravatar.cc/150?u=fallback"}
              alt={user?.displayName || "Admin User"}
              className="w-10 h-10 rounded-full bg-slate-700 object-cover"
            />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-sidebar-foreground truncate">{user?.displayName || user?.email || 'Admin User'}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate">{user?.role || 'Administrator'}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background text-foreground">
        <Outlet />
      </main>
    </div>
  );
};

