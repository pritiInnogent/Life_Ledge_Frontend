class ChartDataService {
  static getCategoryPieData(filter = 'monthly') {
    const data = this._getFilteredData(filter)
    return {
      tooltip: { trigger: 'item' },
      legend: { orient: 'horizontal', bottom: 0 },
      series: [{
        name: 'Categories',
        type: 'pie',
        radius: '50%',
        data: data.categories,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  }

  static _getCategoryPieDataOriginal() {
    return {
      tooltip: { trigger: 'item' },
      legend: { orient: 'horizontal', bottom: 0 },
      series: [{
        name: 'Categories',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 35000, name: 'Food & Dining' },
          { value: 25000, name: 'Transportation' },
          { value: 20000, name: 'Entertainment' },
          { value: 15000, name: 'Healthcare' },
          { value: 12000, name: 'Shopping' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  }

  static getEarningsPieData(filter = 'monthly') {
    const data = this._getFilteredData(filter)
    return {
      tooltip: { trigger: 'item' },
      legend: { orient: 'horizontal', bottom: 0 },
      series: [{
        name: 'Earnings',
        type: 'pie',
        radius: '50%',
        data: data.earnings,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  }

  static _getEarningsPieDataOriginal() {
    return {
      tooltip: { trigger: 'item' },
      legend: { orient: 'horizontal', bottom: 0 },
      series: [{
        name: 'Earnings',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 50000, name: 'Salary' },
          { value: 15000, name: 'Freelance' },
          { value: 8000, name: 'Investment' },
          { value: 5000, name: 'Other Income' }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    }
  }

  static getCategoryBarData(filter = 'monthly') {
    const data = this._getFilteredData(filter)
    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: data.categories.map(item => item.name)
      },
      yAxis: { type: 'value' },
      series: [{
        name: 'Spending',
        data: data.categories.map(item => item.value),
        type: 'bar',
        itemStyle: { color: '#3b82f6' }
      }]
    }
  }

  static _getCategoryBarDataOriginal() {
    return {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['Food', 'Transport', 'Entertainment', 'Healthcare', 'Shopping']
      },
      yAxis: { type: 'value' },
      series: [{
        name: 'Spending',
        data: [35000, 25000, 20000, 15000, 12000],
        type: 'bar',
        itemStyle: { color: '#3b82f6' }
      }]
    }
  }

  static getGoalsLineData(filter = 'monthly') {
    const data = this._getFilteredData(filter)
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Goals', 'Expenditures'] },
      xAxis: {
        type: 'category',
        data: data.timeline
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Goals',
          type: 'line',
          data: data.goals,
          itemStyle: { color: '#10b981' }
        },
        {
          name: 'Expenditures',
          type: 'line',
          data: data.expenditures,
          itemStyle: { color: '#ef4444' }
        }
      ]
    }
  }

  static _getFilteredData(filter) {
    const baseData = {
      weekly: {
        categories: [
          { value: 8000, name: 'Food' },
          { value: 6000, name: 'Transport' },
          { value: 4000, name: 'Entertainment' }
        ],
        earnings: [
          { value: 12000, name: 'Salary' },
          { value: 3000, name: 'Freelance' }
        ],
        timeline: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        goals: [5000, 5000, 5000, 5000, 5000, 5000, 5000],
        expenditures: [4500, 5200, 4800, 5500, 4900, 6000, 5300]
      },
      monthly: {
        categories: [
          { value: 35000, name: 'Food & Dining' },
          { value: 25000, name: 'Transportation' },
          { value: 20000, name: 'Entertainment' },
          { value: 15000, name: 'Healthcare' }
        ],
        earnings: [
          { value: 50000, name: 'Salary' },
          { value: 15000, name: 'Freelance' },
          { value: 8000, name: 'Investment' }
        ],
        timeline: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        goals: [30000, 32000, 35000, 33000, 36000, 38000],
        expenditures: [28000, 34000, 31000, 35000, 33000, 36000]
      },
      yearly: {
        categories: [
          { value: 420000, name: 'Food & Dining' },
          { value: 300000, name: 'Transportation' },
          { value: 240000, name: 'Entertainment' },
          { value: 180000, name: 'Healthcare' }
        ],
        earnings: [
          { value: 600000, name: 'Salary' },
          { value: 180000, name: 'Freelance' },
          { value: 96000, name: 'Investment' }
        ],
        timeline: ['2020', '2021', '2022', '2023', '2024'],
        goals: [350000, 380000, 400000, 420000, 450000],
        expenditures: [340000, 390000, 385000, 410000, 435000]
      }
    }
    return baseData[filter] || baseData.monthly
  }

  static _getGoalsLineDataOriginal() {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Goals', 'Expenditures'] },
      xAxis: {
        type: 'category',
        data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Goals',
          type: 'line',
          data: [30000, 32000, 35000, 33000, 36000, 38000],
          itemStyle: { color: '#10b981' }
        },
        {
          name: 'Expenditures',
          type: 'line',
          data: [28000, 34000, 31000, 35000, 33000, 36000],
          itemStyle: { color: '#ef4444' }
        }
      ]
    }
  }
}

export default ChartDataService