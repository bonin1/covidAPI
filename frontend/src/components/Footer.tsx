import { Github, Heart, Shield } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-400" />
              Kosovo COVID-19 Tracker
            </h3>
            <p className="text-gray-300 text-sm">
              Real-time tracking and analytics for COVID-19 cases, vaccinations, and health data across Kosovo. 
              Providing accurate information to help communities stay informed and safe.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://msh.rks-gov.net/" className="text-gray-300 hover:text-blue-400 transition-colors">
                  Ministry of Health Kosovo
                </a>
              </li>
              <li>
                <a href="https://who.int" className="text-gray-300 hover:text-blue-400 transition-colors">
                  World Health Organization
                </a>
              </li>
              <li>
                <a href="https://ecdc.europa.eu" className="text-gray-300 hover:text-blue-400 transition-colors">
                  European CDC
                </a>
              </li>
            </ul>
          </div>

          {/* Data Sources */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Data Sources</h3>
            <p className="text-gray-300 text-sm mb-2">
              Data is collected from official government sources, health institutions, and verified medical facilities.
            </p>
            <p className="text-gray-300 text-xs">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center text-sm text-gray-300">
            <span>© {currentYear} Kosovo COVID-19 Tracker. Made with</span>
            <Heart className="h-4 w-4 mx-1 text-red-500" />
            <span>for public health.</span>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <a
              href="https://github.com"
              className="text-gray-300 hover:text-blue-400 transition-colors"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
            <span className="text-xs text-gray-500">Open Source Project</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
