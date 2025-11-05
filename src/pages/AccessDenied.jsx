import React from 'react';
import { Link } from 'react-router-dom';

const AccessDenied = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-gray-100 px-4 py-16">
      <div className="max-w-2xl w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-red-100 text-red-700 mx-auto shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="mt-6 text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">Access Denied</h1>
        <p className="mt-3 text-gray-600">You do not have permission to view this page. Please contact an administrator if you believe this is an error.</p>
        <div className="mt-6 grid gap-3 grid-cols-1 sm:grid-cols-2 max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow">
            <span>Go Home</span>
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-white border hover:bg-gray-50 text-gray-800 font-medium shadow">
            <span>Login</span>
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-500">If you believe this is an error, please contact support.</p>
      </div>
    </div>
  );
};

export default AccessDenied;