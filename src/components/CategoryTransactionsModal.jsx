import React from 'react'
import { X } from 'lucide-react'

export default function CategoryTransactionsModal({ category, transactions, onClose }) {
  if (!category) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-[90vw] max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {category.icon || category.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800">{category.name}</h2>
                <p className="text-gray-600">All transactions in this category</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No transactions found</div>
              <p className="text-gray-400 mt-2">This category doesn't have any transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{txn.merchant || 'Unknown Merchant'}</div>
                    <div className="text-sm text-gray-500">{txn.date}</div>
                    {txn.description && (
                      <div className="text-sm text-gray-600 mt-1">{txn.description}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      txn.typeTransaction === 'debit' ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {txn.typeTransaction === 'debit' ? '-' : '+'}₹{Number(txn.amount || 0).toLocaleString()}
                    </div>
                    <div className={`text-sm capitalize ${
                      txn.typeTransaction === 'debit' ? 'text-red-500' : 'text-green-500'
                    }`}>{txn.typeTransaction}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total transactions: {transactions.length}</span>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}