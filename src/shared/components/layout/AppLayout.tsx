import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/shared/components/ui/theme-toggle';
import { tokenStore } from '@/modules/auth/store/token.store';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/shared/components/ui/dropdown-menu';
import { LogOut, User as UserIcon, LayoutDashboard, ShieldAlert, ClipboardList } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import logoLight from '@/assets/brand/roadmap-logo-light.png';
import logoDark from '@/assets/brand/roadmap-logo-dark.png';
import { useAuth } from '@/modules/auth/context/AuthContext';

export const AppLayout = () => {
  const { user, clearUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    tokenStore.clear();
    clearUser();
    navigate('/login');
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  const isGuest = !user;

  const LogoMark = ({ className }: { className?: string }) => (
    <span className={cn('relative inline-flex shrink-0 overflow-hidden', className)}>
      <img src={logoLight} alt="" className="theme-logo-light h-full w-full object-contain" />
      <img src={logoDark} alt="" className="theme-logo-dark h-full w-full object-contain" />
    </span>
  );

  const clientNavItems = [
    { to: '/', label: 'Home' },
    { to: '/roadmap', label: 'Roadmaps' },
    { to: '/features', label: 'Features' },
    { to: '/contact', label: 'Contact' },
  ];

  const accountNavItems: { to: string; label: string; icon: React.ReactNode }[] = [];
  if (!isGuest) {
    accountNavItems.push({ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 mr-2" /> });
    accountNavItems.push({ to: '/quiz-history', label: 'Quiz Review', icon: <ClipboardList className="w-4 h-4 mr-2" /> });
    accountNavItems.push({ to: '/profile', label: 'Profile', icon: <UserIcon className="w-4 h-4 mr-2" /> });
    if (user?.role === 'Admin') {
      accountNavItems.push({ to: '/admin', label: 'Admin', icon: <ShieldAlert className="w-4 h-4 mr-2" /> });
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary selection:text-primary-foreground">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b-2 border-foreground bg-card text-card-foreground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          {/* Logo & Client Links */}
          <div className="flex items-center gap-6">
            <Link
              to="/"
              aria-label="roadmap.dev home"
              className="flex items-center gap-2.5 text-sm font-extrabold tracking-wider uppercase"
            >
              <LogoMark className="size-10" />
              <span className="hidden sm:inline font-mono leading-none">
                roadmap<span className="text-primary">.dev</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {clientNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'px-3 py-1.5 text-xs uppercase tracking-wider font-mono transition-colors rounded-full',
                    location.pathname === item.to
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right Side: Account/Admin Links + Auth + Theme Toggle */}
          <div className="flex items-center gap-3">
            {!isGuest && (
              <nav className="hidden lg:flex items-center gap-1 mr-2 border-r border-border pr-4">
                {accountNavItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'px-3 py-1.5 text-xs uppercase tracking-wider font-mono transition-colors rounded-full flex items-center',
                      location.pathname === item.to
                        ? 'text-foreground font-bold bg-muted'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            )}

            <ThemeToggle />
            
            {isGuest ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs uppercase tracking-wider font-mono rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-block px-4 py-1.5 text-xs uppercase tracking-wider font-mono rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Register
                </Link>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="focus:outline-none rounded-full overflow-hidden hover:ring-2 hover:ring-primary transition-all">
                  <Avatar className="size-9 rounded-full border border-border">
                    <AvatarImage src={user?.avatarUrl} alt={user?.email} className="rounded-full" />
                    <AvatarFallback className="text-xs font-mono font-bold rounded-full bg-muted">{initials}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 font-mono uppercase tracking-wider text-xs">
                  <div className="p-2 pb-1 text-[10px] text-muted-foreground break-all">
                    {user?.email}
                  </div>
                  <DropdownMenuSeparator />
                  {/* Show mobile account links in dropdown if needed, but let's just show them for all sizes to be safe and clean */}
                  {accountNavItems.map(item => (
                     <DropdownMenuItem key={item.to} onClick={() => navigate(item.to)}>
                       {item.icon}
                       {item.label}
                     </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      {/* Clean Footer */}
      <footer className="border-t-2 border-foreground bg-card text-card-foreground py-8 mt-auto">
        <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start">
            <Link to="/" aria-label="roadmap.dev home" className="flex items-center gap-2 text-sm font-mono font-bold">
              <LogoMark className="size-8" />
              <span>roadmap<span className="text-primary">.dev</span></span>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">
              Developer-centric paths to coding mastery. REDESIGNED.
            </p>
          </div>
          <div className="flex gap-4 text-xs font-mono uppercase tracking-wider">
            <Link to="/" className="hover:underline text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/roadmap" className="hover:underline text-muted-foreground hover:text-foreground">Roadmaps</Link>
            <Link to="/features" className="hover:underline text-muted-foreground hover:text-foreground">Features</Link>
            <Link to="/contact" className="hover:underline text-muted-foreground hover:text-foreground">Contact</Link>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            &copy; {new Date().getFullYear()} roadmap.dev
          </div>
        </div>
      </footer>
    </div>
  );
};
