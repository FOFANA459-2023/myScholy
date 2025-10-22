import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaGraduationCap, FaSearch, FaArrowLeft } from 'react-icons/fa';
import Logo from '../assets/Logo.jpg';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const quickLinks = [
    { to: '/', label: 'Home', icon: <FaHome />, description: 'Return to homepage' },
    { to: '/scholarship-list', label: 'Scholarships', icon: <FaGraduationCap />, description: 'Browse available scholarships' },
    { to: '/contact', label: 'Contact', icon: <FaSearch />, description: 'Get help and support' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-4xl w-full">
        {/* Main Error Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 text-red-600 mx-auto mb-6 shadow-lg">
            <img src={Logo} alt="MyScholy logo" className="w-12 h-12 object-contain rounded-full" />
          </div>
          
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          
          <div className="bg-white rounded-lg p-6 shadow-md max-w-2xl mx-auto mb-8">
            <p className="text-lg text-gray-600 mb-4">
              Oops! The page you're looking for doesn't exist.
            </p>
            <p className="text-gray-500 mb-2">
              You tried to access: <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{location.pathname}</code>
            </p>
            <p className="text-sm text-gray-400">
              This might be due to a broken link, a mistyped URL, or the page may have been moved.
            </p>
          </div>

          {/* Auto-redirect notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-8">
            <p className="text-blue-800 font-medium">
              Redirecting to homepage in <span className="font-bold text-blue-900">{countdown}</span> seconds...
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="group bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-100"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100 text-blue-600 mb-4 group-hover:bg-blue-200 transition-colors">
                  {link.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{link.label}</h3>
                <p className="text-sm text-gray-500">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Common Solutions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check the URL for typos</li>
                <li>• Use the navigation menu</li>
                <li>• Try refreshing the page</li>
                <li>• Clear your browser cache</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Still having issues?</h4>
              <p className="text-sm text-gray-600 mb-3">
                If you believe this is an error, please contact our support team.
              </p>
              <Link 
                to="/contact" 
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                <FaSearch className="w-4 h-4 mr-1" />
                Contact Support
              </Link>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
