import React from 'react'
import ReactECharts from 'echarts-for-react'

const PieChart = ({ data, title, height = 300 }) => {
  return (
    <div className="chart-container" style={{ marginTop: '-10px' }}>
      <h4 className="text-lg font-semibold mb-2 text-gray-700">{title}</h4>
      <ReactECharts 
        option={data} 
        style={{ height: `${height}px`, marginTop: '-8px' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}

export default PieChart