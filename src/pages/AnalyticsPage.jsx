import React, { useState, useEffect } from 'react'
import { PieChart as PieChartIcon, DollarSign, BarChart3, TrendingUp, Filter, Download, RefreshCw } from 'lucide-react'
import PieChart from '../components/charts/PieChart'
import BarChart from '../components/charts/BarChart'
import LineChart from '../components/charts/LineChart'
import FilterButtons from '../components/FilterButtons'
import ChartDataService from '../services/chartDataService'
import apiService from '../services/api'
import '../styles/AnalyticsPage.css'

export default function AnalyticsPage() {
  const [activeFilter, setActiveFilter] = useState('monthly')
  const [loading, setLoading] = useState(false)
  const [selectedChart, setSelectedChart] = useState(null)

  const categoryPieData = ChartDataService.getCategoryPieData(activeFilter)
  const earningsPieData = ChartDataService.getEarningsPieData(activeFilter)
  const categoryBarData = ChartDataService.getCategoryBarData(activeFilter)
  const goalsLineData = ChartDataService.getGoalsLineData(activeFilter)

  const handleRefresh = async () => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
  }

  const handleExport = () => {
    console.log('Exporting analytics data...')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Filter Buttons */}
      <div className="px-8 py-6">
        <FilterButtons 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />
      </div>

      {/* Charts Grid */}
      <div className="px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Category Distribution */}
          <div 
            className={`group bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
              selectedChart === 'category' ? 'ring-4 ring-purple-300' : ''
            }`}
            onClick={() => setSelectedChart(selectedChart === 'category' ? null : 'category')}
          >
            <div className="bg-gradient-to-r from-purple-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <PieChartIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Category Distribution</h3>
                    <p className="text-purple-200 text-sm">Spending breakdown by category</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <PieChart data={categoryPieData} title="" height={320} />
            </div>
          </div>

          {/* Earnings Breakdown */}
          <div 
            className={`group bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
              selectedChart === 'earnings' ? 'ring-4 ring-purple-300' : ''
            }`}
            onClick={() => setSelectedChart(selectedChart === 'earnings' ? null : 'earnings')}
          >
            <div className="bg-gradient-to-r from-purple-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Earnings Breakdown</h3>
                    <p className="text-purple-200 text-sm">Income sources analysis</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <PieChart data={earningsPieData} title="" height={320} />
            </div>
          </div>

          {/* Category Spending */}
          <div 
            className={`group bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
              selectedChart === 'spending' ? 'ring-4 ring-purple-300' : ''
            }`}
            onClick={() => setSelectedChart(selectedChart === 'spending' ? null : 'spending')}
          >
            <div className="bg-gradient-to-r from-purple-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Category Spending</h3>
                    <p className="text-purple-200 text-sm">Expenditure comparison</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <BarChart data={categoryBarData} title="" height={320} />
            </div>
          </div>

          {/* Goals vs Expenditures */}
          <div 
            className={`group bg-white rounded-3xl shadow-xl border border-purple-100 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer ${
              selectedChart === 'goals' ? 'ring-4 ring-purple-300' : ''
            }`}
            onClick={() => setSelectedChart(selectedChart === 'goals' ? null : 'goals')}
          >
            <div className="bg-gradient-to-r from-purple-600 to-purple-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Goals vs Expenditures</h3>
                    <p className="text-purple-200 text-sm">Performance tracking</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <LineChart data={goalsLineData} title="" height={320} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
