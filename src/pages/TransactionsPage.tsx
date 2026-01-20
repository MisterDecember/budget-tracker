import { useState, useEffect } from 'react'
import { useAuthStore, useFinanceStore } from '@/stores'
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Tabs, TabsList, TabsTrigger, Badge } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, ArrowUpRight, ArrowDownRight, ArrowLeftRight, Trash2 } from 'lucide-react'
import type { Transaction, TransactionType, Category } from '@/types'

const categories: Category[] = ['Food', 'Transport', 'Utilities', 'Entertainment', 'Shopping', 'Health', 'Housing', 'Insurance', 'Income', 'Investment', 'Other']

export function TransactionsPage() {
  const { user } = useAuthStore()
  const { transactions, loadUserData, addTransaction, deleteTransaction } = useFinanceStore()
  const [filter, setFilter] = useState<'all' | TransactionType>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ type: 'expense' as TransactionType, description: '', amount: '', category: 'Other' as Category, date: new Date().toISOString().split('T')[0] })

  useEffect(() => {
    if (user?.id) loadUserData(user.id, user.provider === 'supabase')
  }, [user?.id, loadUserData])

  const filteredTransactions = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  const handleSave = async () => {
    if (!formData.description.trim() || !formData.amount) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' })
      return
    }
    await addTransaction({
      userId: user!.id,
      type: formData.type,
      description: formData.description.trim(),
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
    }, user!.id, user!.provider === 'supabase')
    toast({ title: 'Transaction added', variant: 'success' })
    setDialogOpen(false)
    setFormData({ type: 'expense', description: '', amount: '', category: 'Other', date: new Date().toISOString().split('T')[0] })
  }

  const handleDelete = async (id: number) => {
    if (confirm('Delete this transaction?')) {
      await deleteTransaction(id, user!.id, user!.provider === 'supabase')
      toast({ title: 'Transaction deleted' })
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <ArrowLeftRight className="w-8 h-8 text-dawn-amber" />
            <span>Transactions</span>
          </h1>
          <p className="text-muted-foreground mt-1">Track every movement</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="btn-dawn">
          <Plus className="h-4 w-4 mr-2" />Add
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-full">
        <TabsList className="glass-subtle p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground">All</TabsTrigger>
          <TabsTrigger value="income" className="rounded-lg data-[state=active]:bg-positive/20 data-[state=active]:text-positive">Income</TabsTrigger>
          <TabsTrigger value="expense" className="rounded-lg data-[state=active]:bg-negative/20 data-[state=active]:text-negative">Expenses</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="glass-card">
        <CardContent className="p-0">
          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <ArrowLeftRight className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">No transactions</p>
              <p className="text-muted-foreground">Start tracking to see activity</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.05]">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${t.type === 'income' ? 'bg-positive/10' : 'bg-negative/10'}`}>
                      {t.type === 'income' ? <ArrowUpRight className="h-5 w-5 text-positive" /> : <ArrowDownRight className="h-5 w-5 text-negative" />}
                    </div>
                    <div>
                      <p className="font-medium">{t.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{formatDate(t.date)}</span>
                        <span className="text-white/20">|</span>
                        <Badge variant="outline" className="text-xs border-white/[0.08] bg-white/[0.02]">{t.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-display font-bold text-lg ${t.type === 'income' ? 'text-positive' : 'text-negative'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id!)} className="opacity-0 group-hover:opacity-100 transition-opacity">
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
          <DialogHeader><DialogTitle className="font-display">Add Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as TransactionType })}>
                <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-white/[0.08]">
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Description</Label>
              <Input placeholder="Grocery shopping" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-glass" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Amount</Label>
              <Input type="number" step="0.01" min="0" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="input-glass" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as Category })}>
                <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-white/[0.08]">{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Date</Label>
              <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input-glass" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSave} className="btn-primary">Add Transaction</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
