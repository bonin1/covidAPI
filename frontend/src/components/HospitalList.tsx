'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Hospital {
  id: number;
  name: string;
  location: string;
  total_beds: number;
  available_beds: number;
  icu_beds: number;
  available_icu_beds: number;
  contact_phone?: string;
  contact_email?: string;
}

interface HospitalListProps {
  hospitals: Hospital[];
}

const HospitalList = ({ hospitals }: HospitalListProps) => {
  const [sortBy, setSortBy] = useState<'name' | 'beds' | 'icu'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const sortedHospitals = [...hospitals].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'beds':
        aValue = a.available_beds;
        bValue = b.available_beds;
        break;
      case 'icu':
        aValue = a.available_icu_beds;
        bValue = b.available_icu_beds;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (newSortBy: 'name' | 'beds' | 'icu') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getOccupancyRate = (available: number, total: number) => {
    const occupied = total - available;
    return total > 0 ? (occupied / total) * 100 : 0;
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600 bg-red-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const SortHeader = ({ children, sortKey }: { children: React.ReactNode; sortKey: 'name' | 'beds' | 'icu' }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className="flex items-center space-x-1 text-left font-medium text-gray-700 hover:text-gray-900 transition-colors"
    >
      <span>{children}</span>
      {sortBy === sortKey && (
        sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hospital Capacity</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">
                  <SortHeader sortKey="name">Hospital</SortHeader>
                </th>
                <th className="text-left py-3 px-4">
                  <SortHeader sortKey="beds">Regular Beds</SortHeader>
                </th>
                <th className="text-left py-3 px-4">
                  <SortHeader sortKey="icu">ICU Beds</SortHeader>
                </th>
                <th className="text-left py-3 px-4">Occupancy</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {sortedHospitals.map((hospital) => {
                const bedOccupancy = getOccupancyRate(hospital.available_beds, hospital.total_beds);
                const icuOccupancy = getOccupancyRate(hospital.available_icu_beds, hospital.icu_beds);
                const isExpanded = expandedId === hospital.id;

                return (
                  <tr key={hospital.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{hospital.name}</div>
                        <div className="text-sm text-gray-500">{hospital.location}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <span className="font-medium">{hospital.available_beds}</span>
                        <span className="text-gray-500"> / {hospital.total_beds}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <span className="font-medium">{hospital.available_icu_beds}</span>
                        <span className="text-gray-500"> / {hospital.icu_beds}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor(bedOccupancy)}`}>
                          {bedOccupancy.toFixed(0)}% Beds
                        </div>
                        <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getOccupancyColor(icuOccupancy)}`}>
                          {icuOccupancy.toFixed(0)}% ICU
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : hospital.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HospitalList;
