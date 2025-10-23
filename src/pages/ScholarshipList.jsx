import React, { useState, useEffect, useCallback, useMemo } from "react";
import { apiService } from "../services/api";
import { Link } from "react-router-dom";

// Filter Component
const Filters = ({
  searchTerm,
  setSearchTerm,
  selectedCountry,
  setSelectedCountry,
  selectedDegreeLevel,
  setSelectedDegreeLevel,
  applicationOngoing,
  setApplicationOngoing,
  uniqueCountries,
  uniqueDegreeLevels,
  onSearch,
}) => {
  const handleSearch = useCallback(() => {
    onSearch({
      search: searchTerm,
      country: selectedCountry,
      degree_level: selectedDegreeLevel,
      application_ongoing: applicationOngoing,
    });
  }, [
    searchTerm,
    selectedCountry,
    selectedDegreeLevel,
    applicationOngoing,
    onSearch,
  ]);

  return (
    <div className="mb-8 bg-white p-4 rounded-lg shadow">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search by scholarship name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

// Loading Skeleton Component
const ScholarshipCardSkeleton = React.memo(() => (
  <div className="bg-white shadow-lg rounded-lg p-6 animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-2"></div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded"></div>
  </div>
));

// Scholarship Card Component
const ScholarshipCard = React.memo(({ scholarship }) => (
  <div className="bg-white shadow-lg rounded-lg p-6 hover:scale-105 transition flex flex-col h-full">
    <h2 className="text-xl font-bold text-black mb-2 line-clamp-2 overflow-hidden text-ellipsis">
      {scholarship.name}
    </h2>
    <div className="flex-grow space-y-1 mb-4">
      <p className="text-sm truncate">
        <span className="font-semibold">Author:</span>
        <span className="ml-1">{scholarship.author}</span>
      </p>
      <p className="text-sm">
        <span className="font-semibold">Posted:</span>{" "}
        {new Date(scholarship.created_at).toLocaleDateString()}
      </p>
      <p className="text-sm">
        <span className="font-semibold">Deadline:</span>{" "}
        {new Date(scholarship.deadline).toLocaleDateString()}
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
    <Link
      to={`/scholarship-detail/${scholarship.id}`}
      className="mt-auto inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
    >
      View Details
    </Link>
  </div>
));

// Main Scholarship List Component
const ScholarshipList = React.memo(() => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDegreeLevel, setSelectedDegreeLevel] = useState("");
  const [applicationOngoing, setApplicationOngoing] = useState(false);

  // Filter options
  const [uniqueCountries, setUniqueCountries] = useState([]);
  const [uniqueDegreeLevels, setUniqueDegreeLevels] = useState([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((params) => {
      performSearch(params);
    }, 300),
    [],
  );

  // Debounce utility function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Perform search with new API
  const performSearch = useCallback(
    async (params = {}) => {
      try {
        setLoading(true);
        setError(null);

        const searchParams = {
          search: searchTerm,
          country: selectedCountry,
          degree_level: selectedDegreeLevel,
          application_ongoing: applicationOngoing,
          page: 1,
          page_size: 20,
          ...params,
        };

        const { data, error } =
          await apiService.searchScholarships(searchParams);

        if (error) throw new Error(error);

        // Handle both paginated response and simple array
        if (data && typeof data === "object" && data.results) {
          // New paginated format
          setScholarships(data.results || []);
          setHasMore(data.has_next || false);
          setCurrentPage(data.page || 1);

          // Update filter options
          if (data.filters) {
            setUniqueCountries(data.filters.unique_countries || []);
            setUniqueDegreeLevels(data.filters.unique_degree_levels || []);
          }
        } else if (Array.isArray(data)) {
          // Simple array format (fallback)
          setScholarships(data);
          setHasMore(false);
          setCurrentPage(1);

          // Extract unique values for filters
          const countries = [
            ...new Set(data.map((s) => s.host_country).filter(Boolean)),
          ];
          const levels = [
            ...new Set(data.map((s) => s.degree_level).filter(Boolean)),
          ];
          setUniqueCountries(countries.sort());
          setUniqueDegreeLevels(levels.sort());
        } else {
          setScholarships([]);
          setHasMore(false);
          setCurrentPage(1);
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, selectedCountry, selectedDegreeLevel, applicationOngoing],
  );

  // Load more scholarships
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const nextPage = currentPage + 1;

      const searchParams = {
        search: searchTerm,
        country: selectedCountry,
        degree_level: selectedDegreeLevel,
        application_ongoing: applicationOngoing,
        page: nextPage,
        page_size: 20,
      };

      const { data, error } = await apiService.searchScholarships(searchParams);

      if (error) throw new Error(error);

      // Handle both paginated response and simple array
      if (data && typeof data === "object" && data.results) {
        setScholarships((prev) => [...prev, ...(data.results || [])]);
        setHasMore(data.has_next || false);
        setCurrentPage(data.page || nextPage);
      } else if (Array.isArray(data)) {
        setScholarships((prev) => [...prev, ...data]);
        setHasMore(false);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    hasMore,
    loading,
    searchTerm,
    selectedCountry,
    selectedDegreeLevel,
    applicationOngoing,
  ]);

  // Initial load
  useEffect(() => {
    performSearch();
  }, []);

  // Handle search with debouncing
  const handleSearch = useCallback(
    (params) => {
      debouncedSearch(params);
    },
    [debouncedSearch],
  );

  // Reset filters
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCountry("");
    setSelectedDegreeLevel("");
    setApplicationOngoing(false);
    performSearch({
      search: "",
      country: "",
      degree_level: "",
      application_ongoing: false,
      page: 1,
    });
  }, [performSearch]);

  if (loading && scholarships.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-black mb-8">Scholarships</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <ScholarshipCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 text-red-500">
        Error: {error}
      </div>
    );
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
          onSearch={handleSearch}
        />

        {scholarships.length === 0 ? (
          <div className="flex flex-col items-center mt-10">
            <p className="text-lg text-gray-600">No scholarships found.</p>
            <button
              onClick={resetFilters}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scholarships.map((scholarship) => (
                <ScholarshipCard
                  key={scholarship.id}
                  scholarship={scholarship}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : "Load More"}
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
