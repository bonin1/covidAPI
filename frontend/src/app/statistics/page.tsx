'use client';

import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, Users, Activity, Syringe, Building2 } from 'lucide-react';
import StatCard from '@/components/StatCard';
import ChartCard from '@/components/ChartCard';
import TrendChart from '@/components/TrendChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import { covidApi } from '@/lib/api';

interface StatisticsData {
  daily: Array<{
    date: string;
    daily_cases: number;
    daily_deaths: number;
    daily_recovered: number;
    active_cases: number;
    hospitalized: number;
    icu_patients: number;
  }>;
  weekly: Array<{
    date: string;
    daily_cases: number;
    daily_deaths: number;
    daily_recovered: number;
    active_cases: number;
    hospitalized: number;
    icu_patients: number;
  }>;
  regional: Array<{
    region_name: string;
    total_cases: number;
    total_deaths: number;
    total_recovered: number;
    active_cases: number;
    cases_per_100k: number;
    vaccination_rate: number;
  }>;
}

export default function StatisticsPage() {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'regional'>('daily');

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        
        const [dailyRes, weeklyRes, regionalRes] = await Promise.all([
          covidApi.getDailyStats(),
          covidApi.getWeeklyStats(),
          covidApi.getMonthlyStats()
        ]);

        setData({
          daily: dailyRes.data.data || [],
          weekly: weeklyRes.data.data || [],
          regional: regionalRes.data.data || []
        });
      } catch (error) {
        console.error('Error fetching statistics:', error);
        // Set fallback data
        setData({
          daily: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            daily_cases: Math.floor(Math.random() * 50) + 10,
            daily_deaths: Math.floor(Math.random() * 3),
            daily_recovered: Math.floor(Math.random() * 40) + 20,
            active_cases: Math.floor(Math.random() * 200) + 50,
            hospitalized: Math.floor(Math.random() * 30) + 10,
            icu_patients: Math.floor(Math.random() * 10) + 2
          })),
          weekly: Array.from({ length: 12 }, (_, i) => ({
            date: new Date(Date.now() - (84 - i * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            daily_cases: Math.floor(Math.random() * 300) + 100,
            daily_deaths: Math.floor(Math.random() * 15) + 5,
            daily_recovered: Math.floor(Math.random() * 250) + 80,
            active_cases: Math.floor(Math.random() * 500) + 100,
            hospitalized: Math.floor(Math.random() * 50) + 20,
            icu_patients: Math.floor(Math.random() * 15) + 5
          })),
          regional: Array.from({ length: 7 }, (_, i) => ({
            region_name: ['Pristina', 'Prizren', 'Peja', 'Gjakova', 'Mitrovica', 'Gjilan', 'Ferizaj'][i],
            total_cases: Math.floor(Math.random() * 1200) + 400,
            total_deaths: Math.floor(Math.random() * 50) + 10,
            total_recovered: Math.floor(Math.random() * 1000) + 300,
            active_cases: Math.floor(Math.random() * 100) + 20,
            cases_per_100k: Math.floor(Math.random() * 500) + 100,
            vaccination_rate: Math.floor(Math.random() * 50) + 30
          }))
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  const getCurrentData = () => {
    if (!data) return [];
    
    switch (timeframe) {
      case 'weekly':
        return data.weekly;
      case 'regional':
        return data.regional.map(item => ({ 
          ...item, 
          date: item.region_name,
          daily_cases: item.total_cases,
          daily_deaths: item.total_deaths,
          daily_recovered: item.total_recovered
        }));
      default:
        return data.daily;
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              COVID-19 Statistics
            </h1>
            <p className="text-gray-600">
              Detailed analytics and trends for COVID-19 data in Kosovo
            </p>
          </div>
          
          {/* Time frame selector */}
          <div className="mt-4 md:mt-0">
            <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1">
              {(['daily', 'weekly', 'regional'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimeframe(period)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                    timeframe === period
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Average Daily Cases"
          value={Math.round(currentData.reduce((sum, item) => sum + (item.daily_cases || 0), 0) / currentData.length)}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Peak Cases"
          value={Math.max(...currentData.map(item => item.daily_cases || 0))}
          icon={TrendingUp}
          color="red"
        />
        <StatCard
          title="Total Recovered"
          value={currentData.reduce((sum, item) => sum + (item.daily_recovered || 0), 0)}
          icon={Activity}
          color="green"
        />
        <StatCard
          title="Average Hospitalized"
          value={Math.round(currentData.reduce((sum, item) => sum + ((item as any).hospitalized || 0), 0) / currentData.length)}
          icon={Building2}
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Cases`}
          subtitle={`Cases over time (${timeframe})`}
        >
          <TrendChart
            data={currentData}
            dataKey="daily_cases"
            title="Cases"
            color="#3b82f6"
            type="area"
            height={300}
          />
        </ChartCard>

        <ChartCard 
          title={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Deaths`}
          subtitle={`Deaths over time (${timeframe})`}
        >
          <TrendChart
            data={currentData}
            dataKey="daily_deaths"
            title="Deaths"
            color="#ef4444"
            type="line"
            height={300}
          />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Recoveries`}
          subtitle={`Recoveries over time (${timeframe})`}
        >
          <TrendChart
            data={currentData}
            dataKey="daily_recovered"
            title="Recovered"
            color="#10b981"
            type="area"
            height={300}
          />
        </ChartCard>

        {(timeframe === 'daily' || timeframe === 'weekly') && (
          <ChartCard 
            title="Hospitalizations"
            subtitle="Hospitalized patients over time"
          >
            <TrendChart
              data={currentData}
              dataKey="hospitalized"
              title="Hospitalized"
              color="#8b5cf6"
              type="line"
              height={300}
            />
          </ChartCard>
        )}

        {timeframe === 'regional' && data && (
          <ChartCard 
            title="Cases per 100k"
            subtitle="Regional case rates per 100,000 population"
          >
            <TrendChart
              data={data.regional}
              dataKey="cases_per_100k"
              title="Cases per 100k"
              color="#ec4899"
              type="bar"
              height={300}
            />
          </ChartCard>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Data Table
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  {timeframe === 'regional' ? 'Region' : 'Date'}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Cases</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Deaths</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Recovered</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Active</th>
                {(timeframe === 'daily' || timeframe === 'weekly') && (
                  <>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hospitalized</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ICU</th>
                  </>
                )}
                {timeframe === 'regional' && (
                  <>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Per 100k</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vaccination %</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentData.slice(-10).reverse().map((item, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {timeframe === 'regional' ? (item as any).region_name : new Date(item.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {(item.daily_cases || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {(item.daily_deaths || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {(item.daily_recovered || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {((item as any).active_cases || 0).toLocaleString()}
                  </td>
                  {(timeframe === 'daily' || timeframe === 'weekly') && (
                    <>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {((item as any).hospitalized || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {((item as any).icu_patients || 0).toLocaleString()}
                      </td>
                    </>
                  )}
                  {timeframe === 'regional' && (
                    <>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {((item as any).cases_per_100k || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {((item as any).vaccination_rate || 0).toFixed(1)}%
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
