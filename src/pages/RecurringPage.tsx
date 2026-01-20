import { useState, useEffect } from 'react'
import { useAuthStore, useFinanceStore } from '@/stores'
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, RefreshCw, ArrowUpRight, ArrowDownRight, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import type { RecurringTransaction, TransactionType, Category, Frequency } from '@/types'

const categories: Category[] = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Housing', 'Insurance', 'Income', 'Investment', 'Other']
const frequencies: { value: Frequency; label: string }[] = [
  { value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }, { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'annually', label: 'Annually' },
]

export function RecurringPage() {
  const { user } = useAuthStore()
  const { recurring, loadUserData, addRecurring, deleteRecurring, getMonthlyIncome, getMonthlyExpenses } = useFinanceStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', type: 'expense' as TransactionType, amount: '', category: 'Other' as Category, frequency: 'monthly' as Frequency, startDate: new Date().toISOString().split('T')[0] })

  useEffect(() => { if (user?.id) loadUserData(user.id, user.provider === 'supabase') }, [user?.id, loadUserData])

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.amount) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' })
      return
    }
    await addRecurring({
      userId: user!.id, name: formData.name.trim(), type: formData.type,
      amount: parseFloat(formData.amount), category: formData.category,
      frequency: formData.frequency, startDate: formData.startDate,
      nextDate: formData.startDate, isActive: true,
    }, user!.id, user!.provider === 'supabase')
    toast({ title: 'Recurring item added', variant: 'success' })
    setDialogOpen(false)
    setFormData({ name: '', type: 'expense', amount: '', category: 'Other', frequency: 'monthly', startDate: new Date().toISOString().split('T')[0] })
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this recurring item?')) {
      await deleteRecurring(id, user!.id, user!.provider === 'supabase')
      toast({ title: 'Item deleted' })
    }
  }

  const monthlyIncome = getMonthlyIncome()
  const monthlyExpenses = getMonthlyExpenses()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-dawn-violet" />
            <span>Recurring</span>
          </h1>
          <p className="text-muted-foreground mt-1">Scheduled flows</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="btn-dawn">
          <Plus className="h-4 w-4 mr-2" />Add
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-card p-5 border-l-2 border-l-positive">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4 text-positive" />
                <span className="text-sm">Monthly Income</span>
              </div>
              <p className="text-3xl font-display font-bold text-positive">{formatCurrency(monthlyIncome)}</p>
            </div>
          </div>
        </div>
        <div className="glass-card p-5 border-l-2 border-l-negative">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingDown className="w-4 h-4 text-negative" />
                <span className="text-sm">Monthly Expenses</span>
              </div>
              <p className="text-3xl font-display font-bold text-negative">{formatCurrency(monthlyExpenses)}</p>
            </div>
          </div>
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          {recurring.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">No recurring items</p>
              <p className="text-muted-foreground">Add subscriptions and scheduled payments</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {recurring.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${r.type === 'income' ? 'bg-positive/10' : 'bg-negative/10'}`}>
                      {r.type === 'income' ? <ArrowUpRight className="h-5 w-5 text-positive" /> : <ArrowDownRight className="h-5 w-5 text-negative" />}
                    </div>
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Badge variant="outline" className="border-white/[0.08] bg-white/[0.02]">{frequencies.find(f => f.value === r.frequency)?.label}</Badge>
                        <span className="text-white/20">|</span>
                        <span>Next: {formatDate(r.nextDate)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-display font-bold text-lg ${r.type === 'income' ? 'text-positive' : 'text-negative'}`}>
                      {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id!)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-negative" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-white/[0.08]">
          <DialogHeader><DialogTitle className="font-display">Add Recurring Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name</Label>
              <Input placeholder="Netflix" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-glass" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Type</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as TransactionType })}>
                  <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-card border-white/[0.08]"><SelectItem value="expense">Expense</SelectItem><SelectItem value="income">Income</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Frequency</Label>
                <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v as Frequency })}>
                  <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-card border-white/[0.08]">{frequencies.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Amount</Label>
                <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-glass" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Category</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as Category })}>
                  <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass-card border-white/[0.08]">{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Start Date</Label>
              <Input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="input-glass" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} className="btn-primary">Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
