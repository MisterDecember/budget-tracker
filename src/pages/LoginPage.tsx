import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores'
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import { Loader2, Mail, Chrome } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  
  const { 
    loginWithEmail, 
    signUpWithEmail, 
    loginWithGoogle, 
    localLogin, 
    localSignUp,
    isLoading, 
    error, 
    clearError,
    checkSession,
    isCloudAuth
  } = useAuthStore()

  // Check for existing session on mount (handles OAuth redirect)
  useEffect(() => {
    if (isCloudAuth) {
      checkSession()
    }
  }, [isCloudAuth, checkSession])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isCloudAuth) {
      // Cloud auth (Supabase)
      if (!email.trim() || !password) {
        toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' })
        return
      }
      
      if (!isLogin) {
        // Sign up validation
        if (password.length < 8) {
          toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
          return
        }
        if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
          toast({ title: 'Error', description: 'Password must contain uppercase, lowercase, and number', variant: 'destructive' })
          return
        }
      }

      const success = isLogin 
        ? await loginWithEmail(email, password)
        : await signUpWithEmail(email, password, username || undefined)
      
      if (success) {
        toast({ title: isLogin ? 'Welcome back' : 'Account created', description: 'Syncing your data...', variant: 'success' })
      }
    } else {
      // Local auth fallback
      if (!username.trim() || !password) {
        toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' })
        return
      }
      if (!isLogin && password.length < 4) {
        toast({ title: 'Error', description: 'Password must be at least 4 characters', variant: 'destructive' })
        return
      }

      const success = isLogin 
        ? await localLogin(username, password)
        : await localSignUp(username, password)
      
      if (success) {
        toast({ title: isLogin ? 'Welcome back' : 'Account created', description: 'See further.', variant: 'success' })
      }
    }
  }

  const handleGoogleLogin = async () => {
    if (!isCloudAuth) {
      toast({ title: 'Not available', description: 'Cloud sync is not configured', variant: 'destructive' })
      return
    }
    await loginWithGoogle()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-horizon-void relative overflow-hidden p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-void-gradient" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-dawn-amber/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[2px] bg-gradient-to-r from-transparent via-dawn-amber/40 to-transparent" />
      
      <div className="w-full max-w-md space-y-8 relative z-10 animate-horizon-rise">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
            <svg viewBox="0 0 80 80" className="w-full h-full">
              <defs>
                <linearGradient id="loginSunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F59E0B"/>
                  <stop offset="100%" stopColor="#EC4899"/>
                </linearGradient>
                <linearGradient id="loginLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06B6D4"/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <ellipse cx="40" cy="52" rx="30" ry="6" fill="url(#loginSunGrad)" opacity="0.2"/>
              <circle cx="40" cy="44" r="16" fill="url(#loginSunGrad)" filter="url(#glow)"/>
              <path d="M8 52 L52 52 L64 40 L72 36" stroke="url(#loginLineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#glow)"/>
            </svg>
          </div>
          <h1 className="text-4xl font-display font-bold tracking-wide mb-2">
            <span className="text-gradient-dawn">Hori</span>
            <span className="text-foreground">zon</span>
          </h1>
          <p className="text-muted-foreground text-lg">Your wealth, forecasted.</p>
        </div>

        {/* Login Card */}
        <Card className="glass-card border-white/[0.08]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl font-display">{isLogin ? 'Welcome back' : 'Start your journey'}</CardTitle>
            <CardDescription>
              {isLogin ? 'Enter your credentials to continue' : 'Create an account to see further'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Google OAuth Button - only show if cloud is configured */}
            {isCloudAuth && (
              <>
                <Button 
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full h-11 bg-white hover:bg-gray-100 text-gray-800 font-medium"
                  disabled={isLoading}
                >
                  <Chrome className="mr-2 h-5 w-5" />
                  Continue with Google
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-horizon-panel px-2 text-muted-foreground">Or continue with email</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username field - only for local auth or cloud signup */}
              {(!isCloudAuth || (!isLogin && isCloudAuth)) && (
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm text-muted-foreground">
                    {isCloudAuth ? 'Display Name (optional)' : 'Username'}
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={isCloudAuth ? 'How should we call you?' : 'Enter username'}
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); clearError() }}
                    className="input-glass h-11"
                  />
                </div>
              )}

              {/* Email field - only for cloud auth */}
              {isCloudAuth && (
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-muted-foreground">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError() }}
                    className="input-glass h-11"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isCloudAuth && !isLogin ? 'Min 8 chars, upper, lower, number' : 'Enter password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError() }}
                  className="input-glass h-11"
                />
              </div>

              {error && (
                <p className="text-sm text-negative bg-negative/10 px-3 py-2 rounded-lg">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full h-11 btn-dawn font-semibold text-base" 
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                {isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); clearError() }}
                className="text-sm text-muted-foreground hover:text-earth-cyan transition-colors"
              >
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <span className="text-earth-cyan font-medium">{isLogin ? 'Sign up' : 'Sign in'}</span>
              </button>
            </div>

            {/* Cloud sync indicator */}
            <div className="text-center pt-2">
              <span className={`text-xs px-2 py-1 rounded-full ${isCloudAuth ? 'bg-growth/20 text-growth' : 'bg-muted text-muted-foreground'}`}>
                {isCloudAuth ? '☁️ Cloud Sync Enabled' : '💾 Local Storage Only'}
              </span>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          See further.
        </p>
      </div>
    </div>
  )
}
