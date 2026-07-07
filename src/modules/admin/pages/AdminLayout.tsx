import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Route, BookOpen, FileText, BarChart3, Settings, HelpCircle, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Career Paths', path: '/admin/career-paths', icon: Route },
  { name: 'Skill Library', path: '/admin/skills', icon: BookOpen },
  { name: 'Resources', path: '/admin/resources', icon: FileText },
  { name: 'Team Analytics', path: '/admin/analytics', icon: BarChart3 },
];

export const AdminLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-black text-slate-300 font-sans">
      <aside className="w-64 border-r border-slate-800 bg-[#0f0f11] flex flex-col">
        {/* Logo Section */}
        <div className="p-6 pb-2">
          <h1 className="text-xl font-bold text-amber-400">DevPath Admin</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Institutional Portal</p>
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
                      ? 'bg-amber-400 text-black shadow-md'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
              className="flex items-center justify-center w-full rounded-lg px-4 py-3 text-sm font-bold bg-amber-400 text-black hover:bg-amber-500 transition-colors shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Career Path
            </NavLink>
          </div>
        </nav>
        
        {/* Footer Navigation */}
        <div className="px-4 py-4 space-y-1 border-t border-slate-800">
          <NavLink to="/admin/settings" className="group flex items-center rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">
            <Settings className="mr-3 h-4 w-4" /> Settings
          </NavLink>
          <NavLink to="/admin/support" className="group flex items-center rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200">
            <HelpCircle className="mr-3 h-4 w-4" /> Support
          </NavLink>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-800 transition-colors cursor-pointer">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Alex Rivera" className="w-10 h-10 rounded-full bg-slate-700 object-cover" />
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-200 truncate">Alex Rivera</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate">Lead Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#0a0a0b]">
        <Outlet />
      </main>
    </div>
  );
};

