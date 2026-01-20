import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { Layout } from '@/components/Layout'
import { Toaster } from '@/components/ui'
import { LoginPage, DashboardPage, AccountsPage, TransactionsPage, DebtsPage, RecurringPage, ForecastPage } from '@/pages'
import { getDB } from '@/lib/db'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function App() {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      try {
        await getDB()
        setIsReady(true)
      } catch (err) {
        console.error('Failed to initialize DB:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize')
      }
    }
    init()
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-horizon-void text-foreground">
        <div className="text-center p-8">
          <h1 className="text-2xl font-display font-bold text-negative mb-4">Error</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-horizon-void relative">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-dawn-amber/10 blur-[120px] rounded-full" />
        <div className="text-center relative z-10">
          <div className="text-3xl font-display font-bold mb-2">
            <span className="text-gradient-dawn">Hori</span>
            <span className="text-foreground">zon</span>
          </div>
          <p className="text-muted-foreground">Initializing...</p>
          <div className="w-8 h-8 border-2 border-earth-cyan border-t-transparent rounded-full animate-spin mx-auto mt-4" />
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/*" element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/gravity" element={<DebtsPage />} />
                <Route path="/debts" element={<Navigate to="/gravity" replace />} />
                <Route path="/recurring" element={<RecurringPage />} />
                <Route path="/outlook" element={<ForecastPage />} />
                <Route path="/forecast" element={<Navigate to="/outlook" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
