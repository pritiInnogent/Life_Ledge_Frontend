import React from 'react'
import ReactECharts from 'echarts-for-react'

const LineChart = ({ data, title, height = 300 }) => {
  return (
    <div className="chart-container">
      <h4 className="text-lg font-semibold mb-4 text-gray-700">{title}</h4>
      <ReactECharts 
        option={data} 
        style={{ height: `${height}px` }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}

export default LineChart