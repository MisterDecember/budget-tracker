import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  icon?: LucideIcon
  variant?: 'default' | 'positive' | 'negative' | 'info'
  format?: 'currency' | 'number' | 'percent'
}

export function StatCard({ title, value, subtitle, icon: Icon, variant = 'default', format = 'currency' }: StatCardProps) {
  const formattedValue = format === 'currency' 
    ? formatCurrency(value)
    : format === 'percent'
    ? `${value.toFixed(1)}%`
    : value.toLocaleString()

  const valueColor = variant === 'positive' 
    ? 'text-success' 
    : variant === 'negative' 
    ? 'text-destructive' 
    : 'text-foreground'

  return (
    <div className={cn('stat-card rounded-lg', variant)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', valueColor)}>{formattedValue}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>
    </div>
  )
}
