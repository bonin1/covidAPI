import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  color?: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
  subtitle?: string;
}

const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  color = 'blue',
  subtitle 
}: StatCardProps) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-200',
      accent: 'bg-blue-100'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      border: 'border-red-200',
      accent: 'bg-red-100'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-200',
      accent: 'bg-green-100'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      border: 'border-yellow-200',
      accent: 'bg-yellow-100'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-200',
      accent: 'bg-purple-100'
    }
  };

  const changeColors = {
    increase: 'text-red-600',
    decrease: 'text-green-600',
    neutral: 'text-gray-600'
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-lg p-6 hover:shadow-lg transition-shadow duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {change && (
            <p className={`text-sm ${changeColors[changeType]} mt-2`}>
              {changeType === 'increase' && '↑'}
              {changeType === 'decrease' && '↓'}
              {change}
            </p>
          )}
        </div>
        <div className={`${colors.accent} p-3 rounded-lg`}>
          <Icon className={`h-8 w-8 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
