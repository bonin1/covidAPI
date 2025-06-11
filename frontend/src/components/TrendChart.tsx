'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface TrendChartProps {
  data: Array<{
    date: string;
    [key: string]: any;
  }>;
  dataKey: string;
  title: string;
  color?: string;
  type?: 'line' | 'area';
  height?: number;
}

const TrendChart = ({ 
  data, 
  dataKey, 
  title, 
  color = '#3b82f6', 
  type = 'line',
  height = 300 
}: TrendChartProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatValue = (value: number) => {
    return value.toLocaleString();
  };

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            stroke="#666"
            fontSize={12}
          />
          <YAxis 
            tickFormatter={formatValue}
            stroke="#666"
            fontSize={12}
          />
          <Tooltip 
            labelFormatter={(label) => `Date: ${formatDate(label)}`}
            formatter={(value: number) => [formatValue(value), title]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            fill={color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="#666"
          fontSize={12}
        />
        <YAxis 
          tickFormatter={formatValue}
          stroke="#666"
          fontSize={12}
        />
        <Tooltip 
          labelFormatter={(label) => `Date: ${formatDate(label)}`}
          formatter={(value: number) => [formatValue(value), title]}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Line 
          type="monotone" 
          dataKey={dataKey} 
          stroke={color} 
          strokeWidth={3}
          dot={{ fill: color, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendChart;
