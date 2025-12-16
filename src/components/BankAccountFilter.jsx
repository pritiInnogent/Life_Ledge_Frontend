import React, { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import apiService from '../services/api'

export default function BankAccountFilter({ value, onChange }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAccounts()
    
    // Listen for account changes to reload
    const handleAccountDeleted = () => {
      loadAccounts()
    }
    
    window.addEventListener('accountDeleted', handleAccountDeleted)
    
    return () => {
      window.removeEventListener('accountDeleted', handleAccountDeleted)
    }
  }, [])

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts()
      const accountsList = Array.isArray(data) ? data : []
      setAccounts(accountsList)
      
      // If current selected account doesn't exist, reset to 'all'
      if (value !== 'all' && !accountsList.some(acc => acc.id === parseInt(value))) {
        onChange('all')
      }
    } catch (err) {
      console.error('Error fetching accounts:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="w-48 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
    )
  }

  return (
    <div className="relative">
      <select
        value={value || 'all'}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-w-[180px]"
      >
        <option value="all">All Accounts</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.bankName} ••••{account.last4Digits}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
    </div>
  )
}