'use client';

import { useEffect, useState } from 'react';
import { Building2, MapPin, Phone, Mail, Bed, AlertTriangle, Users } from 'lucide-react';
import StatCard from '@/components/StatCard';
import HospitalList from '@/components/HospitalList';
import { covidApi } from '@/lib/api';

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
  region_id?: number;
}

export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoading(true);
        const response = await covidApi.getHospitals();
        setHospitals(response.data);
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        // Set fallback data
        setHospitals([
          {
            id: 1,
            name: "University Clinical Center of Kosovo",
            location: "Pristina",
            total_beds: 1200,
            available_beds: 243,
            icu_beds: 45,
            available_icu_beds: 8,
            contact_phone: "+383 38 500 600",
            contact_email: "info@ucck.org"
          },
          {
            id: 2,
            name: "Regional Hospital Prizren",
            location: "Prizren",
            total_beds: 350,
            available_beds: 78,
            icu_beds: 12,
            available_icu_beds: 3,
            contact_phone: "+383 29 222 333",
            contact_email: "info@hospital-prizren.org"
          },
          {
            id: 3,
            name: "Regional Hospital Peja",
            location: "Peja",
            total_beds: 280,
            available_beds: 45,
            icu_beds: 10,
            available_icu_beds: 2,
            contact_phone: "+383 39 123 456",
            contact_email: "info@hospital-peja.org"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  const filteredHospitals = selectedRegion === 'all' 
    ? hospitals 
    : hospitals.filter(hospital => 
        hospital.location.toLowerCase().includes(selectedRegion.toLowerCase())
      );

  const totalCapacity = hospitals.reduce((sum, hospital) => sum + hospital.total_beds, 0);
  const totalAvailable = hospitals.reduce((sum, hospital) => sum + hospital.available_beds, 0);
  const totalICU = hospitals.reduce((sum, hospital) => sum + hospital.icu_beds, 0);
  const availableICU = hospitals.reduce((sum, hospital) => sum + hospital.available_icu_beds, 0);
  
  const occupancyRate = totalCapacity > 0 ? ((totalCapacity - totalAvailable) / totalCapacity) * 100 : 0;
  const icuOccupancyRate = totalICU > 0 ? ((totalICU - availableICU) / totalICU) * 100 : 0;

  const regions = ['all', ...Array.from(new Set(hospitals.map(h => h.location)))];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hospital Capacity Monitoring
            </h1>
            <p className="text-gray-600">
              Real-time bed availability and capacity across Kosovo hospitals
            </p>
          </div>
          
          {/* Region Filter */}
          <div className="mt-4 md:mt-0">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {regions.map(region => (
                <option key={region} value={region}>
                  {region === 'all' ? 'All Regions' : region}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Hospitals"
          value={filteredHospitals.length}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Available Beds"
          value={filteredHospitals.reduce((sum, h) => sum + h.available_beds, 0)}
          subtitle={`of ${filteredHospitals.reduce((sum, h) => sum + h.total_beds, 0)} total`}
          icon={Bed}
          color="green"
        />
        <StatCard
          title="ICU Availability"
          value={filteredHospitals.reduce((sum, h) => sum + h.available_icu_beds, 0)}
          subtitle={`of ${filteredHospitals.reduce((sum, h) => sum + h.icu_beds, 0)} total`}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${occupancyRate.toFixed(1)}%`}
          subtitle={`ICU: ${icuOccupancyRate.toFixed(1)}%`}
          icon={Users}
          color="yellow"
        />
      </div>

      {/* Hospital List */}
      <HospitalList hospitals={filteredHospitals} />

      {/* Hospital Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHospitals.map((hospital) => {
          const bedOccupancy = hospital.total_beds > 0 
            ? ((hospital.total_beds - hospital.available_beds) / hospital.total_beds) * 100 
            : 0;
          const icuOccupancy = hospital.icu_beds > 0 
            ? ((hospital.icu_beds - hospital.available_icu_beds) / hospital.icu_beds) * 100 
            : 0;

          const getStatusColor = (rate: number) => {
            if (rate >= 90) return 'bg-red-100 text-red-800 border-red-200';
            if (rate >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            return 'bg-green-100 text-green-800 border-green-200';
          };

          return (
            <div key={hospital.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {hospital.name}
                  </h3>
                  <div className="flex items-center text-gray-600 text-sm">
                    <MapPin className="h-4 w-4 mr-1" />
                    {hospital.location}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bedOccupancy)}`}>
                  {bedOccupancy.toFixed(0)}% Full
                </div>
              </div>

              {/* Capacity Information */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Regular Beds</span>
                  <span className="text-sm font-medium">
                    {hospital.available_beds} / {hospital.total_beds}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${((hospital.total_beds - hospital.available_beds) / hospital.total_beds) * 100}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ICU Beds</span>
                  <span className="text-sm font-medium">
                    {hospital.available_icu_beds} / {hospital.icu_beds}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full" 
                    style={{ width: `${((hospital.icu_beds - hospital.available_icu_beds) / hospital.icu_beds) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-2 border-t border-gray-200 pt-4">
                {hospital.contact_phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {hospital.contact_phone}
                  </div>
                )}
                {hospital.contact_email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {hospital.contact_email}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Capacity Alert */}
      {occupancyRate > 85 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <h4 className="text-red-800 font-medium">High Capacity Alert</h4>
              <p className="text-red-700 text-sm mt-1">
                Hospital capacity is currently at {occupancyRate.toFixed(1)}%. 
                Consider implementing capacity management measures.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
