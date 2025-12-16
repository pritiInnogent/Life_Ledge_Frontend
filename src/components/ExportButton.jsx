import React, { useState } from 'react'
import { Download, ChevronDown, FileText, Table, File } from 'lucide-react'
import apiService from '../services/api'

const ExportButton = () => {
  const [showDropdown, setShowDropdown] = useState(false)
  const [exporting, setExporting] = useState(false)

  const exportData = async (format) => {
    try {
      setExporting(true)
      setShowDropdown(false)
      
      const selectedAccount = sessionStorage.getItem('selectedAccount')
      const accountId = selectedAccount === 'all' ? null : selectedAccount
      
      // Get all transactions
      const transactions = await apiService.getAllTransactions(accountId)
      
      if (!transactions || transactions.length === 0) {
        alert('No transactions found to export')
        return
      }

      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `LifeLedger_Report_${timestamp}`

      if (format === 'csv') {
        exportToCSV(transactions, filename)
      } else if (format === 'excel') {
        exportToExcel(transactions, filename)
      } else if (format === 'pdf') {
        exportToPDF(transactions, filename)
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const exportToCSV = (data, filename) => {
    const headers = ['Date', 'Merchant', 'Category', 'Type', 'Amount', 'Notes', 'Account']
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.date || '',
        `"${(row.merchant || '').replace(/"/g, '""')}"`,
        `"${(row.category || '').replace(/"/g, '""')}"`,
        row.typeTransaction || '',
        row.amount || 0,
        `"${(row.notes || '').replace(/"/g, '""')}"`,
        `"${(row.bankAccount?.bankName || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    downloadFile(csvContent, `${filename}.csv`, 'text/csv')
  }

  const exportToExcel = (data, filename) => {
    const headers = ['Date', 'Merchant', 'Category', 'Type', 'Amount', 'Notes', 'Account']
    let html = '<table><thead><tr>'
    headers.forEach(header => {
      html += `<th>${header}</th>`
    })
    html += '</tr></thead><tbody>'
    
    data.forEach(row => {
      html += '<tr>'
      html += `<td>${row.date || ''}</td>`
      html += `<td>${row.merchant || ''}</td>`
      html += `<td>${row.category || ''}</td>`
      html += `<td>${row.typeTransaction || ''}</td>`
      html += `<td>${row.amount || 0}</td>`
      html += `<td>${row.notes || ''}</td>`
      html += `<td>${row.bankAccount?.bankName || ''}</td>`
      html += '</tr>'
    })
    html += '</tbody></table>'

    downloadFile(html, `${filename}.xls`, 'application/vnd.ms-excel')
  }

  const exportToPDF = async (data, filename) => {
    try {
      // Get dashboard analytics and insights data
      const selectedAccount = sessionStorage.getItem('selectedAccount')
      const accountId = selectedAccount === 'all' ? null : selectedAccount
      
      let analyticsData = null
      let insightsData = null
      let recurringData = null
      let goalsData = null
      
      try {
        if (accountId && accountId !== 'all') {
          analyticsData = await apiService.getLatestAnalytics(accountId)
          insightsData = await apiService.getInsightsSummary(accountId)
        }
        recurringData = await apiService.getRecurringPatterns(accountId)
        goalsData = await apiService.getGoals()
      } catch (error) {
        console.log('Could not fetch all data for PDF')
      }
      
      const totalAmount = data.reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
      const debitAmount = data.filter(t => (t.typeTransaction || t.type || '').toLowerCase() === 'debit').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
      const creditAmount = data.filter(t => (t.typeTransaction || t.type || '').toLowerCase() === 'credit').reduce((sum, t) => sum + Math.abs(Number(t.amount) || 0), 0)
      
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Please allow popups to export PDF')
        return
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>LifeLedger Complete Financial Report</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.5; color: #333; background: #fff; }
              .header { text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; }
              .header h1 { font-size: 32px; margin-bottom: 8px; font-weight: 800; }
              .header p { font-size: 16px; opacity: 0.9; }
              .section { margin-bottom: 50px; page-break-inside: avoid; }
              .section-title { font-size: 24px; font-weight: 700; color: #8B5CF6; margin-bottom: 20px; border-bottom: 2px solid #8B5CF6; padding-bottom: 8px; }
              .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
              .chart-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
              .chart-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 15px; }
              .summary-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
              .stat-card { text-align: center; padding: 20px; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 12px; border: 1px solid #0ea5e9; }
              .stat-card h3 { font-size: 24px; font-weight: 700; color: #0369a1; margin-bottom: 5px; }
              .stat-card p { font-size: 14px; color: #64748b; }
              .categories-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
              .category-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; background: #fafafa; border-radius: 8px; }
              .category-color { width: 16px; height: 16px; border-radius: 50%; margin-right: 10px; }
              .merchants-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
              .merchant-item { padding: 15px; background: #f8fafc; border-radius: 10px; text-align: center; }
              .insights-content { background: #fef7ff; border: 1px solid #d8b4fe; border-radius: 12px; padding: 25px; }
              .insight-text { font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 15px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background: linear-gradient(135deg, #8B5CF6, #6366F1); color: white; padding: 15px 10px; text-align: left; font-weight: 600; }
              td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; }
              tr:nth-child(even) { background: #f9fafb; }
              .credit { color: #059669; font-weight: 600; }
              .debit { color: #dc2626; font-weight: 600; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; padding: 20px; border-top: 1px solid #e5e7eb; }
              @media print {
                body { font-size: 11px; }
                .header { padding: 20px; }
                .header h1 { font-size: 28px; }
                .section { margin-bottom: 30px; }
                th, td { padding: 8px 6px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>LifeLedger Complete Financial Report</h1>
              <p>Generated on ${new Date().toLocaleDateString('en-GB', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
              })}</p>
            </div>
            
            <!-- Dashboard Analytics Section -->
            <div class="section">
              <h2 class="section-title">📊 Financial Dashboard</h2>
              
              <div class="summary-stats">
                <div class="stat-card">
                  <h3>₹${totalAmount.toLocaleString()}</h3>
                  <p>Total Transactions (${data.length})</p>
                </div>
                <div class="stat-card">
                  <h3 style="color: #dc2626;">₹${debitAmount.toLocaleString()}</h3>
                  <p>Total Debits</p>
                </div>
                <div class="stat-card">
                  <h3 style="color: #059669;">₹${creditAmount.toLocaleString()}</h3>
                  <p>Total Credits</p>
                </div>
              </div>
              
              ${analyticsData ? `
                <div class="dashboard-grid">
                  ${analyticsData.analytics?.topCategories ? `
                    <div class="chart-card">
                      <div class="chart-title">Top Spending Categories</div>
                      <div class="categories-list">
                        ${analyticsData.analytics.topCategories.slice(0, 6).map((cat, i) => `
                          <div class="category-item">
                            <div style="display: flex; align-items: center;">
                              <div class="category-color" style="background: hsl(${i * 60}, 70%, 50%);"></div>
                              <span>${cat.category}</span>
                            </div>
                            <strong>₹${Math.round(cat.amount / 1000)}K</strong>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                  
                  ${analyticsData.analytics?.topMerchants ? `
                    <div class="chart-card">
                      <div class="chart-title">Top Merchants</div>
                      <div class="merchants-grid">
                        ${analyticsData.analytics.topMerchants.slice(0, 6).map(merchant => `
                          <div class="merchant-item">
                            <div style="font-weight: 600; margin-bottom: 5px;">${merchant.merchant}</div>
                            <div style="color: #8B5CF6; font-weight: 700;">₹${Math.round(merchant.amount / 1000)}K</div>
                            <div style="font-size: 12px; color: #6b7280;">${merchant.transactions} txns</div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                  
                  ${analyticsData.analytics?.averages ? `
                    <div class="chart-card">
                      <div class="chart-title">Spending Averages</div>
                      <div style="display: grid; gap: 10px;">
                        <div style="display: flex; justify-content: space-between; padding: 8px; background: #e0f2fe; border-radius: 6px;">
                          <span>Daily Average:</span>
                          <strong>₹${Math.round(analyticsData.analytics.averages.dailySpending || 0)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px; background: #f0fdf4; border-radius: 6px;">
                          <span>Weekly Average:</span>
                          <strong>₹${Math.round(analyticsData.analytics.averages.weeklySpending || 0)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 8px; background: #fef3f2; border-radius: 6px;">
                          <span>Monthly Average:</span>
                          <strong>₹${Math.round(analyticsData.analytics.averages.monthlySpending || 0)}</strong>
                        </div>
                      </div>
                    </div>
                  ` : ''}
                </div>
              ` : ''}
            </div>
            
            <!-- AI Insights Section -->
            ${insightsData ? `
              <div class="section">
                <h2 class="section-title">🤖 AI Financial Insights</h2>
                <div class="insights-content">
                  ${insightsData.insights?.[0]?.aiText ? (() => {
                    try {
                      const parsed = JSON.parse(insightsData.insights[0].aiText)
                      return `
                        <div class="insight-text">
                          <strong>Summary:</strong> ${parsed.summary?.text || 'No summary available'}
                        </div>
                        <div class="insight-text">
                          <strong>Analysis:</strong> ${parsed.analysis || 'No analysis available'}
                        </div>
                        ${parsed.nudges?.length ? `
                          <div>
                            <strong>Recommendations:</strong>
                            <ul style="margin-top: 10px; padding-left: 20px;">
                              ${parsed.nudges.map(nudge => `<li style="margin-bottom: 8px;">${nudge.text}</li>`).join('')}
                            </ul>
                          </div>
                        ` : ''}
                      `
                    } catch (e) {
                      return '<div class="insight-text">AI insights are being processed...</div>'
                    }
                  })() : '<div class="insight-text">AI insights are being processed...</div>'}
                </div>
              </div>
            ` : ''}
            
            <!-- Recurring Patterns Section -->
            ${recurringData && recurringData.length > 0 ? `
              <div class="section">
                <h2 class="section-title">🔄 Recurring Patterns</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Merchant</th>
                      <th>Frequency</th>
                      <th>Avg Amount</th>
                      <th>Next Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${recurringData.slice(0, 10).map(pattern => {
                      const avgAmount = pattern.averageAmount || pattern.amount || pattern.avgAmount || 0
                      return `
                      <tr>
                        <td>${pattern.merchant || '-'}</td>
                        <td>${pattern.frequency || '-'}</td>
                        <td>₹${Math.round(avgAmount).toLocaleString()}</td>
                        <td>${pattern.nextExpectedDate || '-'}</td>
                        <td><span class="${pattern.status === 'overdue' ? 'debit' : 'credit'}">${pattern.status || '-'}</span></td>
                      </tr>
                    `}).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
            
            <!-- Financial Goals Section -->
            ${goalsData && goalsData.length > 0 ? `
              <div class="section">
                <h2 class="section-title">🎯 Financial Goals</h2>
                <div class="dashboard-grid">
                  ${goalsData.map(goal => {
                    const progress = goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0
                    return `
                      <div class="chart-card">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                          <div>
                            <div style="font-weight: 700; font-size: 18px; color: #374151; margin-bottom: 5px;">${goal.name}</div>
                            <div style="font-size: 14px; color: #6b7280;">${goal.description || ''}</div>
                          </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-size: 14px; color: #6b7280;">Progress</span>
                            <span style="font-weight: 600; color: #8B5CF6;">${progress}%</span>
                          </div>
                          <div style="background: #e5e7eb; height: 10px; border-radius: 10px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #8B5CF6, #6366F1); height: 100%; width: ${progress}%; border-radius: 10px;"></div>
                          </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 14px;">
                          <div>
                            <div style="color: #6b7280;">Current</div>
                            <div style="font-weight: 700; color: #059669;">₹${Math.round(goal.currentAmount || 0).toLocaleString()}</div>
                          </div>
                          <div style="text-align: right;">
                            <div style="color: #6b7280;">Target</div>
                            <div style="font-weight: 700; color: #8B5CF6;">₹${Math.round(goal.targetAmount || 0).toLocaleString()}</div>
                          </div>
                        </div>
                        ${goal.deadline ? `
                          <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #6b7280;">
                            Deadline: ${new Date(goal.deadline).toLocaleDateString()}
                          </div>
                        ` : ''}
                      </div>
                    `
                  }).join('')}
                </div>
              </div>
            ` : ''}
            
            <!-- Transactions Section -->
            <div class="section">
              <h2 class="section-title">💳 Transaction History</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Merchant</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Notes</th>
                    <th>Account</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.map(row => `
                    <tr>
                      <td>${row.date || '-'}</td>
                      <td>${row.merchant || '-'}</td>
                      <td>${row.category || row.categoryName || '-'}</td>
                      <td><span class="${row.typeTransaction}">${row.typeTransaction || '-'}</span></td>
                      <td class="${row.typeTransaction}">₹${(row.amount || 0).toLocaleString()}</td>
                      <td>${row.notes || '-'}</td>
                      <td>${row.bankAccount?.bankName || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              <p>Complete Financial Report • ${data.length} transactions • Generated by LifeLedger</p>
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      
      // Wait for content to load before printing
      setTimeout(() => {
        printWindow.focus()
        printWindow.print()
      }, 1000)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('PDF export failed. Please try again.')
    }
  }

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={exporting}
        className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
        title="Export Data"
      >
        <Download className="w-5 h-5" />
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-purple-200/50 py-3 z-50 min-w-[180px]">
          <button
            onClick={() => exportData('csv')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-all text-left font-semibold text-gray-700 hover:text-purple-600"
          >
            <FileText className="w-5 h-5 text-purple-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => exportData('excel')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-all text-left font-semibold text-gray-700 hover:text-purple-600"
          >
            <Table className="w-5 h-5 text-purple-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={() => exportData('pdf')}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-all text-left font-semibold text-gray-700 hover:text-purple-600"
          >
            <File className="w-5 h-5 text-purple-600" />
            <span>Export PDF</span>
          </button>
        </div>
      )}

      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}

export default ExportButton