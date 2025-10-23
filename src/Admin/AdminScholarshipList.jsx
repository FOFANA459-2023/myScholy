import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import NavigationButtons from "../components/NavigationButtons";

// Add custom styles for text clamping
const styles = `
  .line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

const AdminScholarshipList = () => {
  const [scholarships, setScholarships] = useState([]);
  const [filteredScholarships, setFilteredScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State for authentication
  const navigate = useNavigate(); // Hook for navigation

  // Check if the user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      const user = apiService.getCurrentUser();
      const isAuth = apiService.isAuthenticated();

      if (!isAuth || !user || user.user_type !== "admin") {
        navigate("/admin-login"); // Redirect to login page if not authenticated
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      setError("You must be logged in to access this page.");
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Fetch scholarships from Django API
  const fetchScholarships = useCallback(async () => {
    if (!isAuthenticated) return; // Only fetch data if authenticated

    try {
      const { data, error } = await apiService.getAdminScholarships();

      if (error) throw new Error(error);

      // Handle both paginated and simple array responses
      const scholarshipsData = data.results ? data.results : data;
      setScholarships(scholarshipsData);
      setFilteredScholarships(scholarshipsData); // Initialize filtered scholarships
      setLoading(false);
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchScholarships();
    }
  }, [fetchScholarships, isAuthenticated]);

  // Filter scholarships based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = scholarships.filter((scholarship) =>
        scholarship.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredScholarships(filtered);
    } else {
      setFilteredScholarships(scholarships); // Reset to all scholarships if no search term
    }
  }, [searchTerm, scholarships]);

  // Handle scholarship deletion
  const handleDelete = async (id, scholarshipName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${scholarshipName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      console.log("Deleting scholarship with ID:", id); // Debugging log

      // Use the new delete method
      const { data, error } = await apiService.deleteAdminScholarship(id);

      if (error) {
        throw new Error(error); // Throw the error if the deletion fails
      }

      // Update the local state only if the deletion is successful
      setScholarships((prev) =>
        prev.filter((scholarship) => scholarship.id !== id),
      );
      setFilteredScholarships((prev) =>
        prev.filter((scholarship) => scholarship.id !== id),
      );

      console.log("Scholarship deleted successfully:", data.message || id); // Debugging log
      alert(data.message || "Scholarship deleted successfully");
    } catch (error) {
      console.error("Error deleting scholarship:", error); // Log the error
      alert("Failed to delete scholarship. Please try again."); // Notify the user
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <NavigationButtons showBack={true} showHome={false} />
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading scholarships...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <NavigationButtons showBack={true} showHome={false} />
          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg
                  className="mx-auto h-12 w-12 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
                <h3 className="text-lg font-medium">
                  Error Loading Scholarships
                </h3>
                <p className="text-sm text-gray-600 mt-2">{error}</p>
              </div>
              <button
                onClick={fetchScholarships}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <NavigationButtons showBack={true} showHome={false} />
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header with Button and Search Input */}
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <h2 className="text-2xl font-bold text-gray-800">
              Admin Scholarship View
            </h2>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <input
                type="text"
                placeholder="Search by scholarship name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <Link
                to="/post-scholarship"
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-center"
              >
                Post Another Scholarship
              </Link>
            </div>
          </div>

          {/* Scholarship Cards/Table */}
          <div className="overflow-hidden">
            {/* Desktop & Tablet View */}
            <div className="hidden lg:block">
              <table className="min-w-full table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Host Country
                    </th>
                    <th className="w-1/6 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Degree Level
                    </th>
                    <th className="w-1/4 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredScholarships.map((scholarship) => (
                    <tr
                      key={scholarship.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="line-clamp-3 break-words">
                          {scholarship.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="whitespace-nowrap">
                          {new Date(scholarship.deadline).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div
                          className="truncate"
                          title={scholarship.host_country}
                        >
                          {scholarship.host_country}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div
                          className="truncate"
                          title={scholarship.degree_level}
                        >
                          {scholarship.degree_level}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-3">
                          <Link
                            to={`/update-scholarship/${scholarship.id}`}
                            className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 text-center text-xs font-medium whitespace-nowrap"
                          >
                            Update
                          </Link>
                          <button
                            onClick={() =>
                              handleDelete(scholarship.id, scholarship.name)
                            }
                            className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-xs font-medium whitespace-nowrap"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tablet Grid View */}
            <div className="hidden md:block lg:hidden">
              <div className="grid grid-cols-1 gap-4 p-6">
                {filteredScholarships.map((scholarship) => (
                  <div
                    key={scholarship.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-3 gap-4 items-start">
                      <div className="col-span-2">
                        <h3 className="font-medium text-gray-900 text-sm mb-2 break-words">
                          {scholarship.name}
                        </h3>
                        <div className="space-y-1 text-xs text-gray-500">
                          <p>
                            <span className="font-semibold">Deadline:</span>{" "}
                            {new Date(scholarship.deadline).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                          <p>
                            <span className="font-semibold">Country:</span>{" "}
                            {scholarship.host_country}
                          </p>
                          <p>
                            <span className="font-semibold">Level:</span>{" "}
                            {scholarship.degree_level}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          to={`/update-scholarship/${scholarship.id}`}
                          className="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 text-center text-xs font-medium"
                        >
                          Update
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(scholarship.id, scholarship.name)
                          }
                          className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              <div className="space-y-4 p-4">
                {filteredScholarships.map((scholarship) => (
                  <div
                    key={scholarship.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                  >
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm mb-2 break-words leading-snug">
                          {scholarship.name}
                        </h3>
                        <div className="space-y-1 text-xs text-gray-500">
                          <p>
                            <span className="font-semibold">Deadline:</span>{" "}
                            {new Date(scholarship.deadline).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </p>
                          <p>
                            <span className="font-semibold">Country:</span>{" "}
                            {scholarship.host_country}
                          </p>
                          <p>
                            <span className="font-semibold">Level:</span>{" "}
                            {scholarship.degree_level}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/update-scholarship/${scholarship.id}`}
                          className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 text-center text-xs font-medium"
                        >
                          Update
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(scholarship.id, scholarship.name)
                          }
                          className="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {filteredScholarships.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "No scholarships found" : "No scholarships yet"}
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? `No scholarships match "${searchTerm}"`
                    : "Start by creating your first scholarship"}
                </p>
                {searchTerm ? (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Clear Search
                  </button>
                ) : (
                  <Link
                    to="/post-scholarship"
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Create Scholarship
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminScholarshipList;
