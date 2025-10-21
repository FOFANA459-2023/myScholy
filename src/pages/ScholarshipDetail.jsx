import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import NotFound from './NotFound';

const ScholarshipDetail = React.memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [scholarship, setScholarship] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Helper function for date formatting - moved outside component to prevent recreation
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Fetch scholarship details with caching
  const fetchScholarship = useCallback(async () => {
    if (!id) {
      console.log('No ID provided for scholarship fetch');
      return;
    }
    
    if (hasFetched) {
      console.log('Already fetched scholarship, skipping');
      return;
    }
    
    console.log('Fetching scholarship with ID:', id);
    
    try {
      setLoading(true);
      setError(null);
      setHasFetched(true);
      
      // Check cache first
      const cachedData = apiService.getCachedData(`scholarship_${id}`);
      if (cachedData) {
        console.log('Using cached scholarship data');
        setScholarship(cachedData);
        setLoading(false);
        return;
      }
      
      const { data, error } = await apiService.getScholarship(id);

      if (error) {
        console.error('API Error:', error);
        // Check if it's a 404 error
        if (error.includes('404') || error.includes('Not Found') || error.includes('not found')) {
          throw new Error('SCHOLARSHIP_NOT_FOUND');
        }
        throw new Error(error);
      }
      
      console.log('Scholarship data received:', data);
      setScholarship(data);
    } catch (error) {
      console.error('Error fetching scholarship:', error);
      if (error.message === 'SCHOLARSHIP_NOT_FOUND') {
        setError('SCHOLARSHIP_NOT_FOUND');
      } else {
        setError('There was an issue fetching the scholarship details.');
      }
      setHasFetched(false); // Allow retry
    } finally {
      setLoading(false);
    }
  }, [id, hasFetched]);

  // Reset state when ID changes
  useEffect(() => {
    setScholarship(null);
    setError(null);
    setLoading(true);
    setHasFetched(false);
  }, [id]);

  useEffect(() => {
    if (id && !hasFetched) {
      fetchScholarship();
    }
  }, [id, hasFetched, fetchScholarship]);

  // Format eligibility and benefits: first paragraph, then bullets
  const formatParagraphAndBullets = useCallback((text) => {
    if (!text) return null;
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    const [first, ...rest] = lines;
    return (
      <>
        <p className="mb-2 text-sm md:text-base">{first}</p>
        {rest.length > 0 && (
          <ul className="list-disc list-inside text-sm md:text-base space-y-1 pl-4">
            {rest.map((line, idx) => <li key={idx}>{line}</li>)}
          </ul>
        )}
      </>
    );
  }, []);

  // Memoize formatted content to prevent unnecessary re-renders
  const formattedEligibility = useMemo(() => 
    scholarship ? formatParagraphAndBullets(scholarship.eligibility) : null, 
    [scholarship?.eligibility, formatParagraphAndBullets]
  );

  const formattedBenefits = useMemo(() => 
    scholarship ? formatParagraphAndBullets(scholarship.benefits) : null, 
    [scholarship?.benefits, formatParagraphAndBullets]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading scholarship details...</p>
        </div>
      </div>
    );
  }

  if (error === 'SCHOLARSHIP_NOT_FOUND') {
    return <NotFound />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-lg text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchScholarship}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!scholarship) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg text-black">Scholarship not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-2 md:p-6">
      <div className="max-w-4xl mx-auto w-full">
        {/* Navigation Buttons */}
        <div className="flex justify-between mb-4">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/scholarship-list');
              }
            }}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg shadow"
          >
            ← Back
          </button>
          <button
            onClick={() => navigate('/scholarship-list', { replace: true })}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow"
          >
            All Scholarships
          </button>
        </div>
        {/* Card with all meta info in a single row, responsive */}
        <div className="bg-white shadow-xl rounded-2xl p-4 md:p-8 mb-6 border border-blue-100 w-full">
          <h2 className="text-2xl md:text-3xl font-medium text-blue-900 mb-3 break-words tracking-tight leading-tight">{scholarship.name}</h2>
          <div className="flex flex-col text-sm md:text-base text-gray-800 gap-1">
            <span>Author: <span className="text-gray-600">{scholarship.author}</span></span>
            <span>Date Posted: <span className="text-gray-600">{formatDate(scholarship.created_at)}</span></span>
            <span>Deadline: <span className="text-gray-600">{formatDate(scholarship.deadline)}</span></span>
            <span>Host Country: <span className="text-gray-600">{scholarship.host_country}</span></span>
            <span>Degree Level: <span className="text-gray-600">{scholarship.degree_level}</span></span>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-2xl p-4 md:p-8 border border-gray-100 w-full">
          <h3 className="text-xl font-bold text-blue-800 mb-4">Details</h3>
          <div className="space-y-6 text-black">
            <div>
              <h4 className="text-lg font-semibold mb-2 text-blue-700">Description</h4>
              <div className="text-base leading-relaxed whitespace-pre-wrap break-words bg-gray-50 p-4 rounded-lg">
                {scholarship.description}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2 text-blue-700">Eligibility</h4>
              <div className="bg-gray-50 p-4 rounded-lg break-words">
                {formattedEligibility}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2 text-blue-700">Benefits</h4>
              <div className="bg-gray-50 p-4 rounded-lg break-words">
                {formattedBenefits}
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2 text-blue-700">Application Link</h4>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <button
                  onClick={() => {
                    if (!apiService.isAuthenticated()) {
                      navigate('/login');
                      return;
                    }
                    window.open(scholarship.link, '_blank', 'noopener,noreferrer');
                  }}
                  className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium break-all"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ScholarshipDetail;
