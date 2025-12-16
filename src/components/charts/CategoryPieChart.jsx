import React from 'react'

export default function CategoryPieChart({ data, title }) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFF59D', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
  
  const total = data.reduce((sum, item) => sum + item.value, 0)
  
  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <h3 className="text-xl font-bold text-center mb-6 text-gray-800">{title}</h3>
      
      {data.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No data available</div>
      ) : (
        <div className="space-y-4">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
            return (
              <div key={item.name} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  ></div>
                  <span className="font-medium text-gray-700">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">₹{item.value.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{percentage}%</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}