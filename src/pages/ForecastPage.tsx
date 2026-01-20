import { useEffect } from 'react'
import { useAuthStore, useFinanceStore } from '@/stores'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Calendar, Eye, Sparkles } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function ForecastPage() {
  const { user } = useAuthStore()
  const { recurring, loadUserData, getTotalBalance, getMonthlyIncome, getMonthlyExpenses } = useFinanceStore()

  useEffect(() => { if (user?.id) loadUserData(user.id, user.provider === 'supabase') }, [user?.id, loadUserData])

  const totalBalance = getTotalBalance()
  const monthlyIncome = getMonthlyIncome()
  const monthlyExpenses = getMonthlyExpenses()
  const monthlyCashFlow = monthlyIncome - monthlyExpenses

  const forecastData = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() + i)
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      balance: totalBalance + (monthlyCashFlow * (i + 1)),
      income: monthlyIncome,
      expenses: monthlyExpenses,
    }
  })

  const month1 = forecastData[0]
  const month3 = forecastData[2]
  const month6 = forecastData[5]
  const month12 = forecastData[11]

  const categoryData = recurring
    .filter(r => r.type === 'expense' && r.frequency === 'monthly')
    .reduce((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.amount
      return acc
    }, {} as Record<string, number>)

  const categoryChartData = Object.entries(categoryData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  const colors = ['#06B6D4', '#10B981', '#F59E0B', '#EC4899', '#A855F7', '#14B8A6']

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Eye className="w-8 h-8 text-earth-cyan" />
          <span className="text-gradient-earth">The Outlook</span>
        </h1>
        <p className="text-muted-foreground mt-1">Your wealth, forecasted</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '1 Month', value: month1.balance, icon: Calendar, delay: '0ms' },
          { label: '3 Months', value: month3.balance, icon: TrendingUp, delay: '100ms' },
          { label: '6 Months', value: month6.balance, icon: TrendingUp, delay: '200ms' },
          { label: '12 Months', value: month12.balance, icon: Sparkles, delay: '300ms' },
        ].map(({ label, value, icon: Icon, delay }) => (
          <div key={label} className="glass-card p-5 animate-slide-up" style={{ animationDelay: delay }}>
            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <Icon className="h-4 w-4 text-earth-cyan" />
              <span className="text-sm">{label}</span>
            </div>
            <p className={`text-3xl font-display font-bold ${value >= 0 ? 'text-gradient-dawn' : 'text-negative'}`}>
              {formatCurrency(value)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {monthlyCashFlow >= 0 ? '+' : ''}{formatCurrency(monthlyCashFlow)}/mo
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display">Balance Projection</CardTitle>
            <p className="text-sm text-muted-foreground">12-month forecast</p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="outlookGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="50%" stopColor="#EC4899" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#EC4899" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="outlookStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F59E0B"/>
                      <stop offset="100%" stopColor="#EC4899"/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => '$' + (v/1000).toFixed(0) + 'k'} />
                  <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }} formatter={(v: number) => [formatCurrency(v), 'Balance']} />
                  <Area type="monotone" dataKey="balance" stroke="url(#outlookStrokeGradient)" fill="url(#outlookGradient)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-display">Monthly Cash Flow</CardTitle>
            <p className="text-sm text-muted-foreground">Income vs expenses</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="glass-subtle rounded-xl p-4 border-l-2 border-l-positive">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-positive/10">
                      <TrendingUp className="h-5 w-5 text-positive" />
                    </div>
                    <span className="font-medium">Income</span>
                  </div>
                  <span className="text-2xl font-display font-bold text-positive">{formatCurrency(monthlyIncome)}</span>
                </div>
              </div>
              <div className="glass-subtle rounded-xl p-4 border-l-2 border-l-negative">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-negative/10">
                      <TrendingDown className="h-5 w-5 text-negative" />
                    </div>
                    <span className="font-medium">Expenses</span>
                  </div>
                  <span className="text-2xl font-display font-bold text-negative">{formatCurrency(monthlyExpenses)}</span>
                </div>
              </div>
              <div className="horizon-line my-4" />
              <div className="glass-subtle rounded-xl p-4 border-l-2 border-l-earth-cyan">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-earth-cyan/10">
                      <DollarSign className="h-5 w-5 text-earth-cyan" />
                    </div>
                    <span className="font-medium">Net Cash Flow</span>
                  </div>
                  <span className={`text-2xl font-display font-bold ${monthlyCashFlow >= 0 ? 'text-earth-cyan' : 'text-negative'}`}>{formatCurrency(monthlyCashFlow)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="font-display">Expense Categories</CardTitle>
            <p className="text-sm text-muted-foreground">Where your money flows</p>
          </CardHeader>
          <CardContent>
            {categoryChartData.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
                  <TrendingDown className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">Add recurring expenses to see breakdown</p>
              </div>
            ) : (
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData} layout="vertical">
                    <XAxis type="number" stroke="rgba(255,255,255,0.3)" fontSize={12} tickFormatter={(v) => '$' + v} />
                    <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} width={100} />
                    <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} formatter={(v: number) => [formatCurrency(v), 'Amount']} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {categoryChartData.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
