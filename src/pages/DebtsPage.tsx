import { useState, useEffect } from 'react'
import { useAuthStore, useFinanceStore } from '@/stores'
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { generateAmortizationSchedule } from '@/lib/amortization'
import { Plus, Anchor, Trash2, TrendingDown, ChevronRight } from 'lucide-react'
import type { Debt, DebtType } from '@/types'

const debtTypes: { value: DebtType; label: string }[] = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'auto', label: 'Auto Loan' },
  { value: 'student', label: 'Student Loan' },
  { value: 'personal', label: 'Personal Loan' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'medical', label: 'Medical' },
  { value: 'other', label: 'Other' },
]

export function DebtsPage() {
  const { user } = useAuthStore()
  const { debts, loadUserData, addDebt, updateDebt, deleteDebt, getTotalDebt } = useFinanceStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [formData, setFormData] = useState({ name: '', type: 'personal' as DebtType, originalBalance: '', currentBalance: '', interestRate: '', minimumPayment: '', remainingMonths: '' })

  useEffect(() => { if (user?.id) loadUserData(user.id, user.provider === 'supabase') }, [user?.id, loadUserData])

  const openAddDialog = () => {
    setEditingDebt(null)
    setFormData({ name: '', type: 'personal', originalBalance: '', currentBalance: '', interestRate: '', minimumPayment: '', remainingMonths: '' })
    setDialogOpen(true)
  }

  const openEditDialog = (debt: Debt) => {
    setEditingDebt(debt)
    setFormData({
      name: debt.name, type: debt.type,
      originalBalance: debt.originalBalance.toString(), currentBalance: debt.currentBalance.toString(),
      interestRate: debt.interestRate.toString(), minimumPayment: debt.minimumPayment.toString(),
      remainingMonths: debt.remainingMonths.toString()
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.currentBalance) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' })
      return
    }
    const debtData = {
      userId: user!.id, name: formData.name.trim(), type: formData.type,
      originalBalance: parseFloat(formData.originalBalance) || parseFloat(formData.currentBalance),
      currentBalance: parseFloat(formData.currentBalance),
      interestRate: parseFloat(formData.interestRate) || 0,
      minimumPayment: parseFloat(formData.minimumPayment) || 0,
      remainingMonths: parseInt(formData.remainingMonths) || 12,
      startDate: new Date().toISOString().split('T')[0],
    }
    if (editingDebt) {
      await updateDebt({ ...editingDebt, ...debtData }, user!.id, user!.provider === 'supabase')
      toast({ title: 'Gravity updated', variant: 'success' })
    } else {
      await addDebt(debtData, user!.id, user!.provider === 'supabase')
      toast({ title: 'Gravity added', variant: 'success' })
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (editingDebt && confirm('Remove this gravity?')) {
      await deleteDebt(editingDebt.id!, user!.id, user!.provider === 'supabase')
      toast({ title: 'Gravity removed' })
      setDialogOpen(false)
    }
  }

  const totalDebt = getTotalDebt()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Anchor className="w-8 h-8 text-negative" />
            <span>Gravity</span>
          </h1>
          <p className="text-muted-foreground mt-1">Things pulling you down</p>
        </div>
        <Button onClick={openAddDialog} className="btn-dawn">
          <Plus className="h-4 w-4 mr-2" />Add
        </Button>
      </div>

      <div className="glass-card p-6 border-l-2 border-l-negative">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingDown className="w-4 h-4 text-negative" />
              <span className="text-sm">Total Gravity</span>
            </div>
            <p className="text-4xl font-display font-bold text-negative">{formatCurrency(totalDebt)}</p>
            <p className="text-sm text-muted-foreground mt-1">{debts.length} weight{debts.length !== 1 ? 's' : ''} tracked</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {debts.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <Anchor className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">No gravity detected</p>
              <p className="text-muted-foreground">You are flying free. Add a debt to start tracking.</p>
            </CardContent>
          </Card>
        ) : (
          debts.map((debt) => {
            const paidOff = debt.originalBalance - debt.currentBalance
            const progress = (paidOff / debt.originalBalance) * 100
            const schedule = generateAmortizationSchedule(debt.currentBalance, debt.interestRate, debt.remainingMonths)
            
            return (
              <Card key={debt.id} className="glass-card cursor-pointer group hover:border-white/10 transition-all duration-300" onClick={() => openEditDialog(debt)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-negative/10">
                        <Anchor className="w-5 h-5 text-negative" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg">{debt.name}</h3>
                        <p className="text-sm text-muted-foreground">{debt.type.replace('_', ' ')} - {debt.interestRate}% APR</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="text-2xl font-display font-bold text-negative">{formatCurrency(debt.currentBalance)}</p>
                        <p className="text-xs text-muted-foreground">remaining</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-positive to-earth-cyan transition-all duration-500" style={{ width: Math.min(progress, 100) + '%' }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{formatCurrency(paidOff)} paid</span>
                      <span className="text-earth-cyan">{progress.toFixed(1)}% free</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.05]">
                    <div className="text-center">
                      <p className="text-lg font-display font-semibold text-earth-cyan">{formatCurrency(schedule.monthlyPayment)}</p>
                      <p className="text-xs text-muted-foreground">Monthly</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-display font-semibold">{debt.remainingMonths}</p>
                      <p className="text-xs text-muted-foreground">Months Left</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-display font-semibold text-dawn-amber">{formatCurrency(schedule.totalInterest)}</p>
                      <p className="text-xs text-muted-foreground">Interest</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="font-display">{editingDebt ? 'Edit Gravity' : 'Add Gravity'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name</Label>
              <Input placeholder="Car Loan" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-glass" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as DebtType })}>
                <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-white/[0.08]">
                  {debtTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Original Balance</Label>
                <Input type="number" step="0.01" value={formData.originalBalance} onChange={(e) => setFormData({ ...formData, originalBalance: e.target.value })} className="input-glass" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Current Balance</Label>
                <Input type="number" step="0.01" value={formData.currentBalance} onChange={(e) => setFormData({ ...formData, currentBalance: e.target.value })} className="input-glass" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">APR %</Label>
                <Input type="number" step="0.01" value={formData.interestRate} onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })} className="input-glass" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Min Payment</Label>
                <Input type="number" step="0.01" value={formData.minimumPayment} onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })} className="input-glass" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Months Left</Label>
                <Input type="number" value={formData.remainingMonths} onChange={(e) => setFormData({ ...formData, remainingMonths: e.target.value })} className="input-glass" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingDebt && <Button variant="destructive" onClick={handleDelete} className="mr-auto"><Trash2 className="h-4 w-4 mr-2" />Delete</Button>}
            <Button onClick={handleSave} className="btn-primary">{editingDebt ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
