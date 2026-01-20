import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { createUser, verifyUser, clearUserData } from '@/lib/db'

interface AuthUser {
  id: string
  email?: string
  username?: string
  provider: 'supabase' | 'local'
}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  isCloudAuth: boolean
  
  loginWithEmail: (email: string, password: string) => Promise<boolean>
  signUpWithEmail: (email: string, password: string, username?: string) => Promise<boolean>
  loginWithGoogle: () => Promise<boolean>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<boolean>
  deleteAccount: () => Promise<boolean>
  localLogin: (username: string, password: string) => Promise<boolean>
  localSignUp: (username: string, password: string) => Promise<boolean>
  clearError: () => void
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isCloudAuth: isSupabaseConfigured(),

      loginWithEmail: async (email, password) => {
        if (!supabase) { set({ error: 'Cloud auth not configured' }); return false }
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password })
          if (error) { set({ error: error.message, isLoading: false }); return false }
          if (data.user) {
            set({ user: { id: data.user.id, email: data.user.email || undefined, username: data.user.user_metadata?.username, provider: 'supabase' }, isLoading: false })
            return true
          }
          set({ error: 'Login failed', isLoading: false }); return false
        } catch { set({ error: 'Login failed', isLoading: false }); return false }
      },

      signUpWithEmail: async (email, password, username) => {
        if (!supabase) { set({ error: 'Cloud auth not configured' }); return false }
        if (password.length < 8) { set({ error: 'Password must be at least 8 characters' }); return false }
        if (!/[A-Z]/.test(password)) { set({ error: 'Password must contain uppercase letter' }); return false }
        if (!/[a-z]/.test(password)) { set({ error: 'Password must contain lowercase letter' }); return false }
        if (!/[0-9]/.test(password)) { set({ error: 'Password must contain a number' }); return false }
        
        set({ isLoading: true, error: null })
        try {
          const { data, error } = await supabase.auth.signUp({
            email, password,
            options: { data: { username: username || email.split('@')[0] } }
          })
          if (error) { set({ error: error.message, isLoading: false }); return false }
          if (data.user) {
            set({ user: { id: data.user.id, email: data.user.email || undefined, username: username || email.split('@')[0], provider: 'supabase' }, isLoading: false })
            return true
          }
          set({ error: 'Sign up failed', isLoading: false }); return false
        } catch { set({ error: 'Sign up failed', isLoading: false }); return false }
      },

      loginWithGoogle: async () => {
        if (!supabase) { set({ error: 'Cloud auth not configured' }); return false }
        set({ isLoading: true, error: null })
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
          })
          if (error) { set({ error: error.message, isLoading: false }); return false }
          return true
        } catch { set({ error: 'Google login failed', isLoading: false }); return false }
      },

      logout: async () => {
        set({ isLoading: true })
        const user = get().user
        if (supabase && user?.provider === 'supabase') { await supabase.auth.signOut() }
        if (user?.provider === 'local') { await clearUserData(parseInt(user.id)) }
        set({ user: null, isLoading: false, error: null })
      },

      resetPassword: async (email) => {
        if (!supabase) { set({ error: 'Cloud auth not configured' }); return false }
        set({ isLoading: true, error: null })
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
          })
          if (error) { set({ error: error.message, isLoading: false }); return false }
          set({ isLoading: false }); return true
        } catch { set({ error: 'Password reset failed', isLoading: false }); return false }
      },

      deleteAccount: async () => {
        if (!supabase) { set({ error: 'Cloud auth not configured' }); return false }
        set({ isLoading: true, error: null })
        try {
          const { error } = await supabase.rpc('delete_user_account')
          if (error) { set({ error: error.message, isLoading: false }); return false }
          set({ user: null, isLoading: false }); return true
        } catch { set({ error: 'Account deletion failed', isLoading: false }); return false }
      },

      localLogin: async (username, password) => {
        set({ isLoading: true, error: null })
        try {
          const user = await verifyUser(username, password)
          if (user && user.id) {
            set({ user: { id: String(user.id), username: user.username, provider: 'local' }, isLoading: false })
            return true
          }
          set({ error: 'Invalid credentials', isLoading: false }); return false
        } catch { set({ error: 'Login failed', isLoading: false }); return false }
      },

      localSignUp: async (username, password) => {
        if (password.length < 4) { set({ error: 'Password must be at least 4 characters' }); return false }
        set({ isLoading: true, error: null })
        try {
          const userId = await createUser(username, password)
          set({ user: { id: String(userId), username, provider: 'local' }, isLoading: false })
          return true
        } catch { set({ error: 'Username already taken', isLoading: false }); return false }
      },

      clearError: () => set({ error: null }),

      checkSession: async () => {
        if (!supabase) return
        set({ isLoading: true })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            set({ user: { id: session.user.id, email: session.user.email || undefined, username: session.user.user_metadata?.username, provider: 'supabase' }, isLoading: false })
          } else { set({ isLoading: false }) }
        } catch { set({ isLoading: false }) }
      }
    }),
    { name: 'pixelvault-auth', partialize: (state) => ({ user: state.user, isCloudAuth: state.isCloudAuth }) }
  )
)

if (supabase) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      useAuthStore.setState({ user: { id: session.user.id, email: session.user.email || undefined, username: session.user.user_metadata?.username, provider: 'supabase' }, isLoading: false })
    } else if (event === 'SIGNED_OUT') {
      useAuthStore.setState({ user: null, isLoading: false })
    }
  })
}
