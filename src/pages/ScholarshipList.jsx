import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";

// Filter Component
const Filters = ({ searchTerm, setSearchTerm, selectedCountry, setSelectedCountry, selectedDegreeLevel, setSelectedDegreeLevel, applicationOngoing, setApplicationOngoing, uniqueCountries, uniqueDegreeLevels }) => {
  return (
    <div className="mb-8 bg-white p-4 rounded-lg shadow">
      <input
        type="text"
        placeholder="Search by scholarship name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <select
          value={selectedCountry}
          onChange={(e) => setSelectedCountry(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Countries</option>
          {uniqueCountries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <select
          value={selectedDegreeLevel}
          onChange={(e) => setSelectedDegreeLevel(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Degree Levels</option>
          {uniqueDegreeLevels.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={applicationOngoing}
            onChange={(e) => setApplicationOngoing(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-600"
          />
          <span>Application Ongoing</span>
        </label>
      </div>
    </div>
  );
};

// Main Scholarship List Component
const ScholarshipList = React.memo(() => {
  const [scholarships, setScholarships] = useState([]);
  const [filteredScholarships, setFilteredScholarships] = useState([]);
  const [visibleCount, setVisibleCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDegreeLevel, setSelectedDegreeLevel] = useState("");
  const [applicationOngoing, setApplicationOngoing] = useState(false);

  // Fetch scholarships from Django API
  const fetchScholarships = useCallback(async () => {
    try {
      const { data, error } = await apiService.getScholarships();

      if (error) throw new Error(error);

      // Sort by most recent (created_at desc) as default
      const sorted = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setScholarships(sorted);
      setFilteredScholarships(sorted);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScholarships();
  }, [fetchScholarships]);

  // Apply filters and search
  useEffect(() => {
    let filtered = scholarships;

    if (searchTerm) {
      filtered = filtered.filter((scholarship) =>
        scholarship.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCountry) {
      filtered = filtered.filter((scholarship) => scholarship.host_country === selectedCountry);
    }

    if (selectedDegreeLevel) {
      filtered = filtered.filter((scholarship) => scholarship.degree_level === selectedDegreeLevel);
    }

    if (applicationOngoing) {
      const today = new Date();
      filtered = filtered.filter((scholarship) => new Date(scholarship.deadline) > today);
    }

    // Always sort most recent first after filtering
    const sorted = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setFilteredScholarships(sorted);
    setVisibleCount(20);
  }, [searchTerm, selectedCountry, selectedDegreeLevel, applicationOngoing, scholarships]);

  const uniqueCountries = [...new Set(scholarships.map((s) => s.host_country))];
  const uniqueDegreeLevels = [...new Set(scholarships.map((s) => s.degree_level))];

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gray-100">Loading scholarships...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen bg-gray-100 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-8">Scholarships</h1>

        <Filters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCountry={selectedCountry}
          setSelectedCountry={setSelectedCountry}
          selectedDegreeLevel={selectedDegreeLevel}
          setSelectedDegreeLevel={setSelectedDegreeLevel}
          applicationOngoing={applicationOngoing}
          setApplicationOngoing={setApplicationOngoing}
          uniqueCountries={uniqueCountries}
          uniqueDegreeLevels={uniqueDegreeLevels}
        />

        {filteredScholarships.length === 0 ? (
          <div className="flex flex-col items-center mt-10">
            <p className="text-lg text-gray-600">No scholarships found.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCountry("");
                setSelectedDegreeLevel("");
                setApplicationOngoing(false);
              }}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScholarships.slice(0, visibleCount).map((scholarship) => (
              <div key={scholarship.id} className="bg-white shadow-lg rounded-lg p-6 hover:scale-105 transition flex flex-col h-full">
                <h2 className="text-xl font-bold text-black mb-2 line-clamp-2 overflow-hidden text-ellipsis">
                  {scholarship.name}
                </h2>
                <div className="flex-grow space-y-1 mb-4">
                  <p className="text-sm truncate">
                    <span className="font-semibold">Author:</span> 
                    <span className="ml-1">{scholarship.author}</span>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Posted:</span> {new Date(scholarship.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Deadline:</span> {new Date(scholarship.deadline).toLocaleDateString()}
                  </p>
                  <p className="text-sm truncate">
                    <span className="font-semibold">Country:</span> 
                    <span className="ml-1">{scholarship.host_country}</span>
                  </p>
                  <p className="text-sm truncate">
                    <span className="font-semibold">Degree Level:</span> 
                    <span className="ml-1">{scholarship.degree_level}</span>
                  </p>
                </div>
                <a href={`/scholarship-detail/${scholarship.id}`} className="mt-auto inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center">
                  View Details
                </a>
              </div>
            ))}
          </div>
          {visibleCount < filteredScholarships.length && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setVisibleCount((c) => c + 20)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                See more
              </button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
});

export default ScholarshipList;
