import React, { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import NavigationButtons from "../components/NavigationButtons";

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
      
      if (!isAuth || !user || user.user_type !== 'admin') {
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
      setScholarships(data);
      setFilteredScholarships(data); // Initialize filtered scholarships
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
        scholarship.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredScholarships(filtered);
    } else {
      setFilteredScholarships(scholarships); // Reset to all scholarships if no search term
    }
  }, [searchTerm, scholarships]);

  // Handle scholarship deletion
  const handleDelete = async (id) => {
    try {
      console.log("Deleting scholarship with ID:", id); // Debugging log

      // Perform the delete operation via Django API
      const { data, error } = await apiService.deleteScholarship(id);

      if (error) {
        throw new Error(error); // Throw the error if the deletion fails
      }

      // Update the local state only if the deletion is successful
      setScholarships((prev) =>
        prev.filter((scholarship) => scholarship.id !== id)
      );
      setFilteredScholarships((prev) =>
        prev.filter((scholarship) => scholarship.id !== id)
      );

      console.log("Scholarship deleted successfully:", id); // Debugging log
    } catch (error) {
      console.error("Error deleting scholarship:", error); // Log the error
      alert("Failed to delete scholarship. Please try again."); // Notify the user
    }
  };

  if (!isAuthenticated) {
    return <p className="text-center text-gray-600">Redirecting to login...</p>;
  }

  if (loading) {
    return <p className="text-center text-gray-600">Loading scholarships...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500">Error: {error}</p>;
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

        {/* Scholarship Table */}
        <div className="overflow-hidden">
          <div className="hidden md:block">
            {/* Desktop Table */}
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Host Country
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Degree Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {scholarship.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(scholarship.deadline).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scholarship.host_country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {scholarship.degree_level}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-2">
                      <Link
                        to={`/update-scholarship/${scholarship.id}`}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600"
                      >
                        Update
                      </Link>
                      <button
                        onClick={() => handleDelete(scholarship.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Table */}
          <div className="md:hidden">
            {filteredScholarships.map((scholarship) => (
              <div
                key={scholarship.id}
                className="p-4 border-b border-gray-200"
              >
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    <span className="font-semibold">Name:</span>{" "}
                    {scholarship.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Deadline:</span>{" "}
                    {new Date(scholarship.deadline).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Host Country:</span>{" "}
                    {scholarship.host_country}
                  </p>
                  <p className="text-sm text-gray-500">
                    <span className="font-semibold">Degree Level:</span>{" "}
                    {scholarship.degree_level}
                  </p>
                  <div className="flex space-x-2">
                    <Link
                      to={`/update-scholarship/${scholarship.id}`}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-lg hover:bg-yellow-600"
                    >
                      Update
                    </Link>
                    <button
                      onClick={() => handleDelete(scholarship.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
          </div>
        </div>
      </div>
  );
};

export default AdminScholarshipList;