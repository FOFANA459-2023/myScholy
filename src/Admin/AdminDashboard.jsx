import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import NavigationButtons from "../components/NavigationButtons";
import { Snackbar, Alert } from "@mui/material";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | expired
  const [showingResults, setShowingResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [stats, setStats] = useState({
    total_scholarships: 0,
    active_scholarships: 0,
    recent_scholarships: 0,
    total_users: 0,
    total_students: 0,
    total_admins: 0,
    scholarships_by_degree: [],
  });

  useEffect(() => {
    const currentUser = apiService.getCurrentUser();
    if (
      !currentUser ||
      (currentUser.user_type !== "admin" && !currentUser.is_staff)
    ) {
      navigate("/access-denied");
      return;
    }
    setUser(currentUser);
    initializeDashboard();
  }, [navigate]);

  const initializeDashboard = async () => {
    await fetchDashboardStatistics();
    setLoading(false);
  };

  const fetchDashboardStatistics = async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await apiService.getAdminStatistics();
      if (error) throw new Error(error);
      setStats(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setSnackbar({
        open: true,
        message: "Failed to load statistics",
        severity: "error",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchScholarships = async (
    searchParams = {},
    page = 1,
    append = false,
  ) => {
    try {
      const { data, error } = await apiService.getAdminScholarships({
        page: page,
        page_size: 10,
        ...searchParams,
      });
      if (error) throw new Error(error);

      // Handle both paginated and simple array responses
      const scholarshipsData = data.results ? data.results : data;
      const totalCount = data.count || scholarshipsData.length;
      const totalPages = data.total_pages || Math.ceil(totalCount / 10);

      // Sort by most recent first
      const sorted = [...scholarshipsData].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      if (append) {
        setScholarships((prev) => [...prev, ...sorted]);
      } else {
        setScholarships(sorted);
      }

      setCurrentPage(page);
      setTotalCount(totalCount);
      setHasMore(page < totalPages);
    } catch (error) {
      console.error("Error fetching scholarships:", error);
      setSnackbar({
        open: true,
        message: "Failed to load scholarships",
        severity: "error",
      });
    }
  };

  const handleSearch = async () => {
    setCurrentPage(1);
    if (searchTerm.trim()) {
      await fetchScholarships({ search: searchTerm.trim() }, 1, false);
      setShowingResults(true);
    } else {
      await fetchScholarships({}, 1, false);
      setShowingResults(true);
    }
  };

  const loadMoreScholarships = async () => {
    const nextPage = currentPage + 1;
    const searchParams = searchTerm.trim() ? { search: searchTerm.trim() } : {};
    await fetchScholarships(searchParams, nextPage, true);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setScholarships([]);
    setShowingResults(false);
    setStatusFilter("all");
    setCurrentPage(1);
    setTotalCount(0);
    setHasMore(false);
  };

  const handleClearFilter = () => {
    setStatusFilter("all");
  };

  const exportUsersCSV = async () => {
    setExportLoading(true);
    try {
      const { error } = await apiService.exportUsersCSV();
      if (error) throw new Error(error);

      setSnackbar({
        open: true,
        message: "Users exported successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error exporting users:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to export users",
        severity: "error",
      });
    } finally {
      setExportLoading(false);
    }
  };

  const exportActiveCSV = () => {
    const now = new Date();
    const active = scholarships.filter((s) => new Date(s.deadline) > now);

    const headers = [
      "Name",
      "Country",
      "Degree Level",
      "Eligibility",
      "Deadline",
      "Status",
      "Link",
    ];

    const rows = active.map((s) => [
      s.name || "",
      s.host_country || "",
      s.degree_level || "",
      (s.eligibility || "").toString().replace(/\s+/g, " ").trim(),
      new Date(s.deadline).toLocaleDateString(),
      "Active",
      s.link || "",
    ]);

    const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows]
      .map((r) => r.map(escape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `active_scholarships_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setSnackbar({
      open: true,
      message: "Scholarships exported successfully!",
      severity: "success",
    });
  };

  const refreshData = async () => {
    setStatsLoading(true);
    await fetchDashboardStatistics();
    // Only fetch scholarships if user has already searched/filtered
    if (showingResults && (searchTerm || statusFilter !== "all")) {
      await fetchScholarships(
        searchTerm ? { search: searchTerm } : {},
        1,
        false,
      );
    }
  };

  // Filter scholarships based on current filters (already limited to 10 from backend)
  const filteredScholarships = scholarships.filter((s) => {
    const now = new Date();
    const isExpired = new Date(s.deadline) <= now;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && !isExpired) ||
      (statusFilter === "expired" && isExpired);

    return matchesStatus;
  });

  const visibleScholarships = filteredScholarships;

  // Check if user is super admin
  const isSuperAdmin =
    user &&
    (user.is_superuser || (user.profile && user.profile.is_super_admin));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Dashboard Overview
                </h1>
                <p className="text-gray-600">
                  Welcome back, {user?.first_name || user?.username}!
                  Here&apos;s your scholarship management overview.
                </p>
              </div>
              <button
                onClick={refreshData}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                disabled={statsLoading}
              >
                {statsLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
                Refresh
              </button>
            </div>
          </div>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Scholarships
                      </dt>
                      <dd className="text-2xl font-bold text-gray-900">
                        {statsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        ) : (
                          stats.total_scholarships
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Scholarships
                      </dt>
                      <dd className="text-2xl font-bold text-green-600">
                        {statsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        ) : (
                          stats.active_scholarships
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-md rounded-lg hover:shadow-lg transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Recent (30 days)
                      </dt>
                      <dd className="text-2xl font-bold text-purple-600">
                        {statsLoading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                        ) : (
                          stats.recent_scholarships
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Scholarships by Degree Level Chart */}
          {stats.scholarships_by_degree &&
            stats.scholarships_by_degree.length > 0 && (
              <div className="bg-white overflow-hidden shadow-md rounded-lg mb-8">
                <div className="p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Top Degree Levels by Scholarships
                  </h3>
                  <div className="space-y-3">
                    {stats.scholarships_by_degree.map((degree, index) => (
                      <div
                        key={degree.degree_level}
                        className="flex items-center"
                      >
                        <div className="flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700">
                              {degree.degree_level}
                            </span>
                            <span className="text-gray-500">
                              {degree.count} scholarships
                            </span>
                          </div>
                          <div className="mt-1 relative">
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                              <div
                                style={{
                                  width: `${(degree.count / stats.scholarships_by_degree[0]?.count) * 100}%`,
                                }}
                                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                  index === 0
                                    ? "bg-blue-500"
                                    : index === 1
                                      ? "bg-green-500"
                                      : index === 2
                                        ? "bg-yellow-500"
                                        : index === 3
                                          ? "bg-purple-500"
                                          : "bg-gray-500"
                                }`}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          {/* Super Admin Panel */}
          {isSuperAdmin && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-lg font-medium text-yellow-800">
                    Super Admin Panel
                  </h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Export user data and access advanced management features.
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={exportUsersCSV}
                      disabled={exportLoading}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {exportLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      )}
                      Export Users Data
                    </button>
                  </div>

                  {/* Super Admin Only: Detailed User Statistics */}
                  <div className="mt-6 pt-6 border-t border-yellow-200">
                    <h4 className="text-md font-medium text-yellow-800 mb-4">
                      User Analytics (Super Admin Only)
                    </h4>

                    {/* Total Users Overview */}
                    <div className="mb-6">
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="flex items-center justify-center mb-2">
                              <svg
                                className="h-8 w-8 text-blue-500 mr-2"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                />
                              </svg>
                              <span className="text-lg font-medium text-gray-700">
                                Total Platform Users
                              </span>
                            </div>
                            <div className="text-4xl font-bold text-blue-600">
                              {statsLoading ? (
                                <div className="animate-pulse bg-gray-200 h-12 w-24 rounded mx-auto"></div>
                              ) : (
                                stats.total_users
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              All registered users across the platform
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Student Statistics */}
                    <div className="mb-6">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <svg
                          className="h-4 w-4 mr-2 text-indigo-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Student Statistics
                      </h5>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                              {statsLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded mx-auto"></div>
                              ) : (
                                stats.total_students
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Total Students
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {statsLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded mx-auto"></div>
                              ) : (
                                Math.round(
                                  (stats.total_students / stats.total_users) *
                                    100,
                                ) || 0
                              )}
                              %
                            </div>
                            <div className="text-sm text-gray-600">
                              Of Total Users
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {statsLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded mx-auto"></div>
                              ) : (
                                new Date().getFullYear() - 2020
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Years Active
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Statistics */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <svg
                          className="h-4 w-4 mr-2 text-orange-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Admin Statistics
                      </h5>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {statsLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded mx-auto"></div>
                              ) : (
                                stats.total_admins
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Total Admins
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {statsLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded mx-auto"></div>
                              ) : (
                                Math.round(
                                  (stats.total_admins / stats.total_users) *
                                    100,
                                ) || 0
                              )}
                              %
                            </div>
                            <div className="text-sm text-gray-600">
                              Of Total Users
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {statsLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded mx-auto"></div>
                              ) : (
                                Math.round(
                                  stats.total_scholarships /
                                    (stats.total_admins || 1),
                                )
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Scholarships per Admin
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-600">
                              {statsLoading ? (
                                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded mx-auto"></div>
                              ) : stats.total_admins > 0 ? (
                                Math.round(
                                  (stats.total_students / stats.total_admins) *
                                    10,
                                ) / 10
                              ) : (
                                0
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              Students per Admin
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* User Growth Visualization */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <svg
                          className="h-4 w-4 mr-2 text-blue-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                        User Distribution
                      </h5>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <div className="space-y-3">
                          {/* Students Bar */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-indigo-700 font-medium">
                                Students
                              </span>
                              <span className="text-gray-600">
                                {stats.total_students} users
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${(stats.total_students / (stats.total_users || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Admins Bar */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-orange-700 font-medium">
                                Admins
                              </span>
                              <span className="text-gray-600">
                                {stats.total_admins} users
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${(stats.total_admins / (stats.total_users || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Other Users Bar */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700 font-medium">
                                Other Users
                              </span>
                              <span className="text-gray-600">
                                {stats.total_users -
                                  stats.total_students -
                                  stats.total_admins}{" "}
                                users
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gray-500 h-2 rounded-full transition-all duration-500"
                                style={{
                                  width: `${((stats.total_users - stats.total_students - stats.total_admins) / (stats.total_users || 1)) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  to="/post-scholarship"
                  className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 text-center transition-colors"
                >
                  <svg
                    className="h-8 w-8 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <div className="font-medium">Post New Scholarship</div>
                </Link>

                <Link
                  to="/admin-scholarship-list"
                  className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 text-center transition-colors"
                >
                  <svg
                    className="h-8 w-8 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <div className="font-medium">Manage Scholarships</div>
                </Link>

                <Link
                  to="/user-management"
                  className="bg-purple-500 text-white p-4 rounded-lg hover:bg-purple-600 text-center transition-colors"
                >
                  <svg
                    className="h-8 w-8 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <div className="font-medium">User Management</div>
                </Link>

                <button
                  onClick={exportActiveCSV}
                  className="bg-orange-500 text-white p-4 rounded-lg hover:bg-orange-600 text-center transition-colors"
                >
                  <svg
                    className="h-8 w-8 mx-auto mb-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div className="font-medium">Export Active CSV</div>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Scholarships */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 sm:mb-0">
                  Recent Scholarships
                </h3>

                {/* Search and Filter Controls */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Search scholarships..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={handleSearch}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                    >
                      Search
                    </button>
                    {searchTerm && (
                      <button
                        onClick={handleClearSearch}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active Only</option>
                      <option value="expired">Expired Only</option>
                    </select>
                    {statusFilter !== "all" && (
                      <button
                        onClick={handleClearFilter}
                        className="bg-orange-500 text-white px-3 py-2 rounded-lg hover:bg-orange-600 text-sm"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Scholarships List */}
              <div className="space-y-4">
                {scholarships.length === 0 && showingResults ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="h-12 w-12 mx-auto mb-4"
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
                    <p>No scholarships match your search criteria</p>
                  </div>
                ) : !showingResults ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="h-12 w-12 mx-auto mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Search for Scholarships
                    </h3>
                    <p>
                      Use the search box or filters above to view scholarships
                    </p>
                  </div>
                ) : visibleScholarships.length > 0 ? (
                  visibleScholarships.map((scholarship) => {
                    const isExpired =
                      new Date(scholarship.deadline) <= new Date();
                    return (
                      <div
                        key={scholarship.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900 mb-2">
                              {scholarship.name}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Country:</span>{" "}
                                {scholarship.host_country}
                              </div>
                              <div>
                                <span className="font-medium">Level:</span>{" "}
                                {scholarship.degree_level}
                              </div>
                              <div>
                                <span className="font-medium">Deadline:</span>{" "}
                                {new Date(
                                  scholarship.deadline,
                                ).toLocaleDateString()}
                              </div>
                              <div>
                                <span className="font-medium">Created:</span>{" "}
                                {new Date(
                                  scholarship.created_at,
                                ).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isExpired
                                  ? "bg-red-100 text-red-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {isExpired ? "Expired" : "Active"}
                            </span>
                            <Link
                              to={`/update-scholarship/${scholarship.id}`}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : null}
              </div>

              {/* Pagination and Results Info */}
              {showingResults && (
                <div className="mt-6 space-y-4">
                  {/* Results Info */}
                  {visibleScholarships.length > 0 && (
                    <div className="text-center text-sm text-gray-600">
                      Showing {visibleScholarships.length} of {totalCount}{" "}
                      scholarships
                      {searchTerm && <span> for &quot;{searchTerm}&quot;</span>}
                      {statusFilter !== "all" && (
                        <span> • Filtered by {statusFilter}</span>
                      )}
                    </div>
                  )}

                  {/* Load More Button */}
                  {hasMore && visibleScholarships.length > 0 && (
                    <div className="text-center">
                      <button
                        onClick={loadMoreScholarships}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                        Load More ({totalCount - visibleScholarships.length}{" "}
                        remaining)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {/* Navigation */}
          <div className="mt-8">
            <NavigationButtons showBack={true} showHome={false} />
          </div>
        </div>
      </div>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdminDashboard;
