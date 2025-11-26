import React from 'react'
import ReactECharts from 'echarts-for-react'
import styles from './CategoryPieChart.module.css'

export default function CategoryPieChart({ data, title }) {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFF59D', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
  
  const coloredData = data.map((item, index) => ({
    ...item,
    itemStyle: {
      color: colors[index % colors.length],
      borderRadius: 8,
      borderColor: '#fff',
      borderWidth: 3
    }
  }))

  const option = {
    title: {
      text: title,
      left: 'center',
      top: '5%',
      textStyle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ₹{c} ({d}%)',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: '#4f46e5',
      borderWidth: 2,
      textStyle: {
        color: '#fff',
        fontSize: 14
      }
    },
    legend: {
      orient: 'vertical',
      right: '10%',
      top: 'center',
      textStyle: {
        fontSize: 12,
        color: '#374151'
      },
      itemGap: 15
    },
    series: [
      {
        name: 'Categories',
        type: 'pie',
        radius: '60%',
        center: ['35%', '50%'],
        data: coloredData,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: (idx) => idx * 100,
        label: {
          show: false
        },
        labelLine: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 14,
            fontWeight: 'bold',
            color: '#000000'
          },
          itemStyle: {
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          },
          scale: true,
          scaleSize: 10
        },

      }
    ]
  }

  return (
    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <ReactECharts 
        option={option} 
        style={{ height: '400px', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}