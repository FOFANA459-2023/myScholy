import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NotFound = () => {
  const location = useLocation();
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-100 text-blue-700 mx-auto shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">Page not found</h1>
        <p className="mt-3 text-gray-600">We couldn't find any content at <span className="font-mono bg-white/70 px-1 py-0.5 rounded border text-gray-800">{location.pathname}</span>.</p>
        <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2 max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow">
            <span>Go Home</span>
          </Link>
          <Link to="/scholarship-list" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white border hover:bg-gray-50 text-gray-800 font-medium shadow">
            <span>Browse Scholarships</span>
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-500">If you believe this is an error, try refreshing the page or navigating from the menu.</p>
      </div>
    </div>
  );
};

export default NotFound;
