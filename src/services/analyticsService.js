class AnalyticsService {
  constructor(apiService) {
    this.apiService = apiService
  }

  async getCategoryAnalytics() {
    try {
      const [categories, transactions] = await Promise.all([
        this.apiService.getAllCategories(),
        this.apiService.getAllTransactions()
      ])

      return this._processTransactionData(categories, transactions)
    } catch (error) {
      return this._getFallbackData()
    }
  }

  _processTransactionData(categories, transactions) {
    const expenseData = {}
    const earningsData = {}

    transactions.forEach(transaction => {
      const category = categories.find(cat => cat.id === transaction.categoryId)
      if (!category) return

      const amount = Math.abs(transaction.amount)
      
      if (this._isExpense(transaction)) {
        expenseData[category.name] = (expenseData[category.name] || 0) + amount
      } else {
        earningsData[category.name] = (earningsData[category.name] || 0) + amount
      }
    })

    return {
      expenses: Object.entries(expenseData).map(([name, amount]) => ({ name, amount })),
      earnings: Object.entries(earningsData).map(([name, amount]) => ({ name, amount }))
    }
  }

  _isExpense(transaction) {
    return transaction.type === 'DEBIT' || transaction.amount < 0
  }

  _getFallbackData() {
    return {
      expenses: [
        { name: 'Food', amount: 35000 },
        { name: 'Transportation', amount: 25000 },
        { name: 'Entertainment', amount: 20000 },
        { name: 'Healthcare', amount: 15000 }
      ],
      earnings: [
        { name: 'Salary', amount: 50000 },
        { name: 'Freelance', amount: 15000 },
        { name: 'Investment', amount: 8000 },
        { name: 'Other Income', amount: 5000 }
      ]
    }
  }
}

export default AnalyticsService