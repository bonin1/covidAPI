'use client';

import { useState } from 'react';
import { Activity, Menu, X, Globe, Shield, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: Activity },
    { name: 'Statistics', href: '/statistics', icon: TrendingUp },
    { name: 'Hospitals', href: '/hospitals', icon: Shield },
    { name: 'Vaccinations', href: '/vaccinations', icon: Users },
    { name: 'Regions', href: '/regions', icon: Globe },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-900 to-indigo-900 shadow-lg border-b border-blue-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-300" />
              <span className="text-xl font-bold text-white">Kosovo COVID-19</span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-blue-100 hover:bg-blue-800 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="bg-blue-800 inline-flex items-center justify-center p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-700 transition-colors duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blue-800">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-blue-100 hover:bg-blue-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 flex items-center space-x-2"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
