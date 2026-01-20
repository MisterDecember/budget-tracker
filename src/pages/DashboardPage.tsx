import { useEffect } from 'react'
import { useAuthStore, useFinanceStore } from '@/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency, formatDate } from '@/lib/utils'
import { TrendingUp, TrendingDown, Wallet, Anchor, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Sparkles } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'

export function DashboardPage() {
  const { user } = useAuthStore()
  const { 
    accounts, transactions, debts, recurring, isLoading,
    loadUserData, getTotalBalance, getTotalDebt, getNetWorth,
    getMonthlyIncome, getMonthlyExpenses
  } = useFinanceStore()

  useEffect(() => {
    if (user?.id) loadUserData(user.id, user.provider === 'supabase')
  }, [user?.id, loadUserData])

  const totalBalance = getTotalBalance()
  const totalDebt = getTotalDebt()
  const netWorth = getNetWorth()
  const monthlyIncome = getMonthlyIncome()
  const monthlyExpenses = getMonthlyExpenses()
  const monthlyCashFlow = monthlyIncome - monthlyExpenses

  const forecastData = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      balance: totalBalance + (monthlyCashFlow * (i + 1))
    }
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-earth-cyan border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading your horizon...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative py-8">
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-dawn-amber" />
            <span>Net Worth</span>
          </p>
          <h1 className={cn(
            "text-5xl md:text-6xl font-display font-bold tracking-tight",
            netWorth >= 0 ? "text-gradient-dawn" : "text-negative"
          )}>
            {formatCurrency(netWorth)}
          </h1>
          <p className="text-muted-foreground mt-2">
            {monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(monthlyCashFlow)}/month
          </p>
        </div>

        <div className="horizon-line my-8" />

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="glass-card p-6 border-l-2 border-l-positive">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="w-4 h-4 text-positive" />
                  <span className="text-sm">The Sky</span>
                </div>
                <p className="text-sm text-muted-foreground">Your assets & income</p>
              </div>
              <Wallet className="w-5 h-5 text-positive" />
            </div>
            <p className="text-3xl font-display font-bold text-positive mt-4">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">{accounts.length} accounts</p>
          </div>

          <div className="glass-card p-6 border-l-2 border-l-negative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingDown className="w-4 h-4 text-negative" />
                  <span className="text-sm">Gravity</span>
                </div>
                <p className="text-sm text-muted-foreground">Pulling you down</p>
              </div>
              <Anchor className="w-5 h-5 text-negative" />
            </div>
            <p className="text-3xl font-display font-bold text-negative mt-4">{formatCurrency(totalDebt)}</p>
            <p className="text-xs text-muted-foreground mt-1">{debts.length} debts tracked</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="glass-card p-5 border-l-2 border-l-positive">
          <p className="text-sm text-muted-foreground mb-1">Monthly Income</p>
          <p className="text-2xl font-display font-bold text-positive">{formatCurrency(monthlyIncome)}</p>
        </div>
        <div className="glass-card p-5 border-l-2 border-l-negative">
          <p className="text-sm text-muted-foreground mb-1">Monthly Expenses</p>
          <p className="text-2xl font-display font-bold text-negative">{formatCurrency(monthlyExpenses)}</p>
        </div>
        <div className="glass-card p-5 border-l-2 border-l-earth-cyan">
          <p className="text-sm text-muted-foreground mb-1">Cash Flow</p>
          <p className={cn(
            "text-2xl font-display font-bold",
            monthlyCashFlow >= 0 ? "text-earth-cyan" : "text-negative"
          )}>
            {monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(monthlyCashFlow)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <span className="text-gradient-earth">The Outlook</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground">6-month balance projection</p>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="viewBalanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="month" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => '$' + (v/1000).toFixed(0) + 'k'} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }} 
                    formatter={(v: number) => [formatCurrency(v), 'Balance']} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#06B6D4" 
                    fill="url(#viewBalanceGradient)" 
                    strokeWidth={2} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display">Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Latest transactions</p>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <ArrowLeftRight className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground/60">Start tracking to see activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.slice(0, 5).map((t) => (
                  <div 
                    key={t.id} 
                    className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        t.type === 'income' ? 'bg-positive/10' : 'bg-negative/10'
                      )}>
                        {t.type === 'income' 
                          ? <ArrowUpRight className="h-4 w-4 text-positive" /> 
                          : <ArrowDownRight className="h-4 w-4 text-negative" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-foreground transition-colors">{t.description}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(t.date)} - {t.category}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "font-display font-semibold",
                      t.type === 'income' ? 'text-positive' : 'text-negative'
                    )}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
