import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { Button } from '@/components/ui'
import { 
  Compass,       // View (dashboard)
  Wallet,        // Accounts
  ArrowLeftRight, // Transactions
  Anchor,        // Gravity (debts)
  RefreshCw,     // Recurring
  TrendingUp,    // The Outlook (forecast) - changed from Telescope
  LogOut 
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/', icon: Compass, label: 'View' },
  { path: '/accounts', icon: Wallet, label: 'Accounts' },
  { path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { path: '/gravity', icon: Anchor, label: 'Gravity' },
  { path: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { path: '/outlook', icon: TrendingUp, label: 'Outlook' },
]

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  return (
    <div className="min-h-screen flex flex-col bg-horizon-void">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-dawn-amber/5 blur-[120px] pointer-events-none" />
      
      <header className="sticky top-0 z-40 glass border-b border-white/[0.06]">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <defs>
                  <linearGradient id="headerSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B"/>
                    <stop offset="100%" stopColor="#EC4899"/>
                  </linearGradient>
                  <linearGradient id="headerLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06B6D4"/>
                    <stop offset="100%" stopColor="#10B981"/>
                  </linearGradient>
                </defs>
                <circle cx="20" cy="22" r="8" fill="url(#headerSunGrad)" className="group-hover:scale-110 transition-transform origin-center" style={{ transformBox: 'fill-box' }}/>
                <path d="M4 26 L26 26 L32 20 L36 18" stroke="url(#headerLineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <span className="font-display font-semibold text-xl tracking-wide">
              <span className="text-gradient-dawn">Hori</span>
              <span className="text-foreground">zon</span>
            </span>
          </Link>
          
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
                <div className="w-2 h-2 rounded-full bg-positive animate-pulse" />
                <span className="text-sm font-medium text-earth-cyan">{user?.username}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="sticky top-16 z-30 glass-subtle border-b border-white/[0.04] overflow-x-auto">
        <div className="container flex">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'nav-item flex-1 min-w-[80px] text-center',
                location.pathname === path && 'active'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium hidden sm:block">{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <main className="flex-1 container py-8 relative">
        {children}
      </main>
      
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-earth-cyan/5 blur-[100px] pointer-events-none" />
    </div>
  )
}
