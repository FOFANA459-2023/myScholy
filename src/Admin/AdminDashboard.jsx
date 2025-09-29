import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import NavigationButtons from '../components/NavigationButtons';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [scholarships, setScholarships] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | expired
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalScholarships: 0,
    activeScholarships: 0,
    expiredScholarships: 0,
    recentScholarships: 0
  });

  useEffect(() => {
    const currentUser = apiService.getCurrentUser();
    if (!currentUser || (currentUser.user_type !== 'admin' && !currentUser.is_staff)) {
      navigate('/access-denied');
      return;
    }
    setUser(currentUser);
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      const { data, error } = await apiService.getAdminScholarships();
      if (error) throw new Error(error);
      // Sort most recent first by created_at
      const sorted = [...data].sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      setScholarships(sorted);
      
      // Calculate statistics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const activeScholarships = data.filter(s => new Date(s.deadline) > now);
      const expiredScholarships = data.filter(s => new Date(s.deadline) <= now);
      const recentScholarships = data.filter(s => new Date(s.created_at) > oneWeekAgo);
      
      setStats({
        totalScholarships: data.length,
        activeScholarships: activeScholarships.length,
        expiredScholarships: expiredScholarships.length,
        recentScholarships: recentScholarships.length
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportActivePDF = () => {
    const now = new Date();
    const active = scholarships.filter(s => new Date(s.deadline) > now);
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Active Scholarships</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h1 { font-size: 18px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
          th { background: #f5f5f5; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Active Scholarships (${active.length})</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Country</th>
              <th>Degree Level</th>
              <th>Eligibility</th>
              <th>Deadline</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            ${active.map(s => `
              <tr>
                <td>${(s.name||'').replace(/</g,'&lt;')}</td>
                <td>${(s.host_country||'')}</td>
                <td>${(s.degree_level||'')}</td>
                <td>${(s.eligibility||'').toString().replace(/</g,'&lt;')}</td>
                <td>${new Date(s.deadline).toLocaleDateString()}</td>
                <td><a href="${s.link||'#'}" target="_blank">Open</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <script>window.onload = function(){ window.print(); };</script>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  const handleLogout = async () => {
    await apiService.logout();
    navigate('/');
  };

  const exportActiveCSV = () => {
    const now = new Date();
    const active = scholarships.filter(s => new Date(s.deadline) > now);
    const headers = [
      'Name','Country','Degree Level','Eligibility','Deadline','Status','Link'
    ];
    const rows = active.map(s => [
      s.name || '',
      s.host_country || '',
      s.degree_level || '',
      (s.eligibility || '').toString().replace(/\s+/g,' ').trim(),
      new Date(s.deadline).toISOString(),
      'Active',
      s.link || ''
    ]);
    const escape = (val) => `"${String(val).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `active_scholarships_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Derived: filtered and paginated recent list
  const filtered = scholarships.filter(s => {
    const matchesSearch = !searchTerm || (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const now = new Date();
    const isExpired = new Date(s.deadline) <= now;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && !isExpired) || (statusFilter === 'expired' && isExpired);
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    // Reset pagination when filters change
    setVisibleCount(10);
  }, [searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Overview</h1>
            <p className="text-gray-600">
              Welcome back, {user?.first_name || user?.username}! Here's your scholarship management overview.
            </p>
          </div>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">📚</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Scholarships
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalScholarships}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">✅</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Scholarships
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeScholarships}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">⏰</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Expired Scholarships
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.expiredScholarships}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold">🆕</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Recent (7 days)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.recentScholarships}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/post-scholarship"
                className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">+</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Add New Scholarship</h3>
                  <p className="text-sm text-gray-500">Create a new scholarship posting</p>
                </div>
              </Link>

              <Link
                to="/admin-scholarship-list"
                className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">📋</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">Manage Scholarships</h3>
                  <p className="text-sm text-gray-500">View and edit existing scholarships</p>
                </div>
              </Link>

              <Link
                to="/user-management"
                className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">👤</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900">User Management</h3>
                  <p className="text-sm text-gray-500">Manage platform users</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Scholarships */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Scholarships</h2>
            <div className="flex items-center gap-2">
              <button onClick={exportActiveCSV} className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm">Export Active CSV</button>
              <button onClick={exportActivePDF} className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm">Export Active PDF</button>
            </div>
          </div>
          {/* Controls */}
          <div className="px-6 pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div className="overflow-hidden">
            {scholarships.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No scholarships found. Create your first scholarship to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtered.slice(0, visibleCount).map((scholarship) => {
                      const isExpired = new Date(scholarship.deadline) <= new Date();
                      return (
                       <tr key={scholarship.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                              {scholarship.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {scholarship.host_country}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(scholarship.deadline).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              isExpired 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              to={`/update-scholarship/${scholarship.id}`}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </Link>
                            <Link
                              to={`/scholarship-detail/${scholarship.id}`}
                              className="text-green-600 hover:text-green-900"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {filtered.length > visibleCount && (
              <div className="p-4 flex justify-center">
                <button
                  onClick={() => setVisibleCount(c => c + 5)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  See more
                </button>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
  );
};

export default AdminDashboard;
