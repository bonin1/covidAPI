'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface RegionChartProps {
  data: Array<{
    region: string;
    cases: number;
    population?: number;
    [key: string]: any;
  }>;
  type?: 'bar' | 'pie';
  height?: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const RegionChart = ({ data, type = 'bar', height = 300 }: RegionChartProps) => {
  const formatValue = (value: number) => {
    return value.toLocaleString();
  };

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ region, percent }) => `${region} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="cases"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [formatValue(value), 'Cases']}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="region" 
          stroke="#666"
          fontSize={12}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          tickFormatter={formatValue}
          stroke="#666"
          fontSize={12}
        />
        <Tooltip 
          formatter={(value: number) => [formatValue(value), 'Cases']}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Bar 
          dataKey="cases" 
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default RegionChart;
