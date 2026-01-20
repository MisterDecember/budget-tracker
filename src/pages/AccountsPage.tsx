import { useState, useEffect } from 'react'
import { useAuthStore, useFinanceStore } from '@/stores'
import { Button, Card, CardContent, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'
import { Plus, Wallet, PiggyBank, CreditCard, Banknote, TrendingUp, ChevronRight, Trash2 } from 'lucide-react'
import type { Account, AccountType } from '@/types'

const accountIcons: Record<AccountType, typeof Wallet> = {
  checking: Wallet,
  savings: PiggyBank,
  credit: CreditCard,
  cash: Banknote,
  investment: TrendingUp,
}

const accountColors: Record<AccountType, string> = {
  checking: 'text-earth-cyan',
  savings: 'text-positive',
  credit: 'text-dawn-pink',
  cash: 'text-dawn-amber',
  investment: 'text-earth-teal',
}

const accountBgColors: Record<AccountType, string> = {
  checking: 'bg-earth-cyan/10',
  savings: 'bg-positive/10',
  credit: 'bg-dawn-pink/10',
  cash: 'bg-dawn-amber/10',
  investment: 'bg-earth-teal/10',
}

export function AccountsPage() {
  const { user } = useAuthStore()
  const { accounts, loadUserData, addAccount, updateAccount, deleteAccount, getTotalBalance } = useFinanceStore()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({ name: '', type: 'checking' as AccountType, balance: '' })

  useEffect(() => {
    if (user?.id) loadUserData(user.id, user.provider === 'supabase')
  }, [user?.id, loadUserData])

  const openAddDialog = () => {
    setEditingAccount(null)
    setFormData({ name: '', type: 'checking', balance: '' })
    setDialogOpen(true)
  }

  const openEditDialog = (account: Account) => {
    setEditingAccount(account)
    setFormData({ name: account.name, type: account.type, balance: account.balance.toString() })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Please enter account name', variant: 'destructive' })
      return
    }
    
    const accountData = {
      userId: user!.id,
      name: formData.name.trim(),
      type: formData.type,
      balance: parseFloat(formData.balance) || 0,
    }

    if (editingAccount) {
      await updateAccount({ ...editingAccount, ...accountData }, user!.id, user!.provider === 'supabase')
      toast({ title: 'Account updated', variant: 'success' })
    } else {
      await addAccount(accountData, user!.id, user!.provider === 'supabase')
      toast({ title: 'Account added', variant: 'success' })
    }
    setDialogOpen(false)
  }

  const handleDelete = async () => {
    if (editingAccount && confirm('Delete this account?')) {
      await deleteAccount(editingAccount.id!, user!.id, user!.provider === 'supabase')
      toast({ title: 'Account deleted' })
      setDialogOpen(false)
    }
  }

  const totalBalance = getTotalBalance()

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Wallet className="w-8 h-8 text-earth-cyan" />
            <span>Accounts</span>
          </h1>
          <p className="text-muted-foreground mt-1">Your financial foundation</p>
        </div>
        <Button onClick={openAddDialog} className="btn-dawn">
          <Plus className="h-4 w-4 mr-2" />Add
        </Button>
      </div>

      <div className="glass-card p-6 border-l-2 border-l-earth-cyan">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="w-4 h-4 text-earth-cyan" />
              <span className="text-sm">Total Balance</span>
            </div>
            <p className={`text-4xl font-display font-bold ${totalBalance >= 0 ? 'text-gradient-earth' : 'text-negative'}`}>{formatCurrency(totalBalance)}</p>
            <p className="text-sm text-muted-foreground mt-1">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.length === 0 ? (
          <Card className="glass-card col-span-full">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium mb-1">No accounts yet</p>
              <p className="text-muted-foreground">Add your first account to get started.</p>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => {
            const Icon = accountIcons[account.type] || Wallet
            return (
              <Card key={account.id} className="glass-card cursor-pointer group hover:border-white/10 transition-all duration-300" onClick={() => openEditDialog(account)}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${accountBgColors[account.type]}`}>
                        <Icon className={`h-5 w-5 ${accountColors[account.type]}`} />
                      </div>
                      <div>
                        <p className="font-display font-semibold">{account.name}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{account.type}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className={`text-2xl font-display font-bold ${account.balance >= 0 ? 'text-positive' : 'text-negative'}`}>
                    {formatCurrency(account.balance)}
                  </p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="font-display">{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Name</Label>
              <Input placeholder="Main Checking" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-glass" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as AccountType })}>
                <SelectTrigger className="input-glass"><SelectValue /></SelectTrigger>
                <SelectContent className="glass-card border-white/[0.08]">
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="investment">Investment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Balance</Label>
              <Input type="number" step="0.01" placeholder="0.00" value={formData.balance} onChange={(e) => setFormData({ ...formData, balance: e.target.value })} className="input-glass" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingAccount && <Button variant="destructive" onClick={handleDelete} className="mr-auto"><Trash2 className="h-4 w-4 mr-2" />Delete</Button>}
            <Button onClick={handleSave} className="btn-primary">{editingAccount ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
