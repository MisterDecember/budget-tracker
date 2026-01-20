import type { AmortizationSchedule, AmortizationPayment } from '@/types'

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) return principal / termMonths
  const monthlyRate = annualRate / 100 / 12
  return (
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths))) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)
  )
}

export function generateAmortizationSchedule(
  principal: number,
  annualRate: number,
  termMonths: number,
  startDate: Date = new Date()
): AmortizationSchedule {
  const schedule: AmortizationPayment[] = []
  const monthlyRate = annualRate / 100 / 12
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths)
  let balance = principal
  let totalInterest = 0
  let totalPrincipal = 0

  for (let month = 1; month <= termMonths; month++) {
    const interestPayment = balance * monthlyRate
    const principalPayment = monthlyPayment - interestPayment
    balance -= principalPayment

    if (balance < 0.01) balance = 0

    totalInterest += interestPayment
    totalPrincipal += principalPayment

    const paymentDate = new Date(startDate)
    paymentDate.setMonth(paymentDate.getMonth() + month)

    schedule.push({
      month,
      date: paymentDate.toISOString().split('T')[0],
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance,
      totalInterest,
      totalPrincipal,
    })
  }

  return {
    monthlyPayment,
    totalPayments: monthlyPayment * termMonths,
    totalInterest,
    schedule,
  }
}

export function calculateWithExtraPayments(
  principal: number,
  annualRate: number,
  termMonths: number,
  extraMonthly: number = 0
): {
  monthsToPayoff: number
  originalMonths: number
  monthsSaved: number
  totalInterest: number
  interestSaved: number
  schedule: AmortizationPayment[]
} {
  const schedule: AmortizationPayment[] = []
  const monthlyRate = annualRate / 100 / 12
  const basePayment = calculateMonthlyPayment(principal, annualRate, termMonths)
  const actualPayment = basePayment + extraMonthly
  let balance = principal
  let month = 0
  let totalInterest = 0
  let totalPrincipal = 0

  while (balance > 0 && month < termMonths * 2) {
    month++
    const interestPayment = balance * monthlyRate
    let principalPayment = actualPayment - interestPayment

    if (principalPayment > balance) {
      principalPayment = balance
    }

    balance -= principalPayment
    if (balance < 0.01) balance = 0
    totalInterest += interestPayment
    totalPrincipal += principalPayment

    schedule.push({
      month,
      date: '',
      payment: interestPayment + principalPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance,
      totalInterest,
      totalPrincipal,
    })
  }

  const baseSchedule = generateAmortizationSchedule(principal, annualRate, termMonths)

  return {
    monthsToPayoff: month,
    originalMonths: termMonths,
    monthsSaved: termMonths - month,
    totalInterest,
    interestSaved: baseSchedule.totalInterest - totalInterest,
    schedule,
  }
}

export function calculateCreditCardPayoff(
  balance: number,
  apr: number,
  monthlyPayment: number
): { error?: string; monthsToPayoff?: number; totalInterest?: number; totalPayments?: number } {
  if (monthlyPayment <= balance * (apr / 100 / 12)) {
    return { error: 'Payment too low to pay off balance' }
  }

  const monthlyRate = apr / 100 / 12
  let remainingBalance = balance
  let month = 0
  let totalInterest = 0

  while (remainingBalance > 0 && month < 600) {
    month++
    const interestCharge = remainingBalance * monthlyRate
    let principalPayment = monthlyPayment - interestCharge

    if (principalPayment > remainingBalance) {
      principalPayment = remainingBalance
    }

    remainingBalance -= principalPayment
    if (remainingBalance < 0.01) remainingBalance = 0
    totalInterest += interestCharge
  }

  return {
    monthsToPayoff: month,
    totalInterest,
    totalPayments: balance + totalInterest,
  }
}

interface DebtInput {
  name: string
  currentBalance: number
  interestRate: number
  minimumPayment: number
}

export function calculateDebtPayoff(
  debts: DebtInput[],
  extraPayment: number = 0,
  method: 'avalanche' | 'snowball' = 'avalanche'
): {
  totalMonths: number
  totalInterestPaid: number
  payoffOrder: { name: string; payoffMonth: number }[]
} {
  const sortedDebts = [...debts]
    .map((d) => ({ ...d, balance: d.currentBalance, paidOff: false, payoffMonth: 0 }))
    .sort((a, b) =>
      method === 'avalanche' ? b.interestRate - a.interestRate : a.balance - b.balance
    )

  let month = 0
  let totalInterestPaid = 0
  let availableExtra = extraPayment

  while (sortedDebts.some((d) => !d.paidOff) && month < 600) {
    month++
    const monthExtra = availableExtra

    for (const debt of sortedDebts) {
      if (debt.paidOff) continue

      const monthlyRate = debt.interestRate / 100 / 12
      const interest = debt.balance * monthlyRate
      const isTarget = debt === sortedDebts.find((d) => !d.paidOff)
      let payment = debt.minimumPayment + (isTarget ? monthExtra : 0)

      if (payment > debt.balance + interest) {
        payment = debt.balance + interest
      }

      const principal = payment - interest
      debt.balance -= principal
      totalInterestPaid += interest

      if (debt.balance <= 0.01) {
        debt.balance = 0
        debt.paidOff = true
        debt.payoffMonth = month
        availableExtra += debt.minimumPayment
      }
    }
  }

  return {
    totalMonths: month,
    totalInterestPaid,
    payoffOrder: sortedDebts.map((d) => ({ name: d.name, payoffMonth: d.payoffMonth })),
  }
}
