import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
}

const ChartCard = ({ title, children, subtitle, actions }: ChartCardProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
