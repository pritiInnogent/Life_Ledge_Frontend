// Test data that matches the backend AnalyticsDTO structure
export const mockAnalyticsResponse = {
  monthlyTimeline: [
    { month: "Jan", income: 50000, expenses: 35000, savings: 15000 },
    { month: "Feb", income: 52000, expenses: 38000, savings: 14000 },
    { month: "Mar", income: 48000, expenses: 42000, savings: 6000 },
    { month: "Apr", income: 55000, expenses: 40000, savings: 15000 },
    { month: "May", income: 53000, expenses: 45000, savings: 8000 },
    { month: "Jun", income: 57000, expenses: 43000, savings: 14000 }
  ],
  burnRate: {
    currentRate: 1500.0,
    trend: "stable",
    daysToZero: 20
  },
  topCategories: [
    { category: "Food & Dining", amount: 15000.0, percentage: 35.0 },
    { category: "Transportation", amount: 8000.0, percentage: 18.5 },
    { category: "Entertainment", amount: 6000.0, percentage: 14.0 },
    { category: "Shopping", amount: 5500.0, percentage: 12.8 },
    { category: "Healthcare", amount: 4000.0, percentage: 9.3 }
  ],
  topMerchants: [
    { merchant: "Swiggy", amount: 8500.0, transactions: 25, bankAccount: "HDFC-1234" },
    { merchant: "Uber", amount: 6200.0, transactions: 18, bankAccount: "HDFC-1234" },
    { merchant: "Amazon", amount: 4800.0, transactions: 12, bankAccount: "SBI-5678" },
    { merchant: "Zomato", amount: 3200.0, transactions: 15, bankAccount: "HDFC-1234" }
  ],
  spendingTypes: {
    recurring: 28000.0,
    oneTime: 15000.0,
    recurringPercentage: 65.1,
    oneTimePercentage: 34.9
  },
  averages: {
    dailySpending: 1433.0,
    weeklySpending: 10031.0,
    monthlySpending: 43000.0
  },
  yearOverYear: {
    currentYearTotal: 258000.0,
    previousYearTotal: 234000.0,
    changePercentage: 10.3,
    trend: "increasing"
  }
}