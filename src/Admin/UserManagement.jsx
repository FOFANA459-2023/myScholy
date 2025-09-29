
import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { FaUserShield, FaTrash, FaPlus, FaCrown, FaUserEdit, FaUsers, FaSave } from "react-icons/fa";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, IconButton, Tooltip, Chip, Box, Typography, Paper, Select, MenuItem, InputLabel, FormControl, Pagination } from "@mui/material";

const UserManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", password: "", first_name: "", last_name: "", is_super_admin: false });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  // Statistics
  const [stats, setStats] = useState({ total: 0, superAdmins: 0, staff: 0 });
  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, first_name: '', last_name: '', email: '', is_super_admin: false });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  // Current user and permissions
  const [currentUser, setCurrentUser] = useState(() => apiService.getCurrentUser());
  const isActingSuperAdmin = !!(currentUser?.is_superuser || currentUser?.profile?.is_super_admin);
  // Enterprise features state
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all | staff | super
  const [sortBy, setSortBy] = useState('name'); // name | email | role
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch all admin users
  const fetchAdmins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiService.getAdmins();
      if (res.error) throw new Error(res.error);
      setAdmins(res.data);
      // Calculate statistics
      let total = res.data.length;
      let superAdmins = res.data.filter(a => a.is_super_admin || a.is_superuser).length;
      let staff = res.data.filter(a => a.is_staff && !a.is_super_admin && !a.is_superuser).length;
      setStats({ total, superAdmins, staff });
    } catch (err) {
      setError("Failed to fetch admin users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
    // Keep current user in sync in case it changed
    setCurrentUser(apiService.getCurrentUser());
  }, []);

  // Derived data: filtered, searched, sorted, paginated
  const normalized = admins.map(a => ({
    ...a,
    fullName: `${a.first_name || ''} ${a.last_name || ''}`.trim(),
    role: (a.is_super_admin || a.is_superuser) ? 'super' : 'staff',
  }));
  const filtered = normalized.filter(a => {
    const matchesRole = roleFilter === 'all' ? true : a.role === roleFilter;
    const q = search.toLowerCase();
    const matchesQuery = !q ||
      a.fullName.toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.username || '').toLowerCase().includes(q);
    return matchesRole && matchesQuery;
  });
  const sorted = [...filtered].sort((x, y) => {
    if (sortBy === 'email') return (x.email || '').localeCompare(y.email || '');
    if (sortBy === 'role') return x.role.localeCompare(y.role);
    return x.fullName.localeCompare(y.fullName);
  });
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const pageItems = sorted.slice(startIdx, startIdx + pageSize);

  const exportCSV = () => {
    const headers = ['First Name','Last Name','Email','Role','Username'];
    const rows = sorted.map(a => [
      a.first_name || '', a.last_name || '', a.email || '', a.role.toUpperCase(), a.username || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'admins_export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Add admin (new endpoint)
  const handleAddAdmin = async () => {
    setAddLoading(true);
    setAddError("");
    try {
      // Only super admins can create super admins; coerce to false for staff admins
      const requestedSuper = addForm.is_super_admin;
      const finalIsSuper = isActingSuperAdmin ? requestedSuper : false;
      const payload = {
        user: {
          email: addForm.email,
          username: addForm.email,
          password: addForm.password,
          first_name: addForm.first_name,
          last_name: addForm.last_name,
        },
        is_super_admin: finalIsSuper,
      };
      const res = await apiService.createAdmin(payload);
      if (res.error) throw new Error(res.error);
      setOpenAdd(false);
      setAddForm({ email: "", password: "", first_name: "", last_name: "", is_super_admin: false });
      fetchAdmins();
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // Delete admin (new endpoint)
  const handleDeleteAdmin = async (userId) => {
    setDeleteLoading(userId);
    try {
      const res = await apiService.deleteAdmin(userId);
      if (res.error) throw new Error(res.error);
      fetchAdmins();
    } catch (err) {
      setError("Failed to delete admin.");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Edit admin (open dialog)
  const handleEditOpen = (admin) => {
    setEditForm({
      // Use user_id from backend for targeting PATCH/DELETE
      id: admin.user_id,
      first_name: admin.first_name,
      last_name: admin.last_name,
      email: admin.email,
      is_super_admin: admin.is_super_admin || admin.is_superuser,
    });
    setEditError('');
    setEditOpen(true);
  };

  // Edit admin (submit)
  const handleEditAdmin = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      if (!isActingSuperAdmin) {
        throw new Error('Only super admins can edit admins');
      }
      const payload = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        is_super_admin: editForm.is_super_admin,
      };
      const res = await apiService.updateAdmin(editForm.id, payload);
      if (res.error) throw new Error(res.error);
      setEditOpen(false);
      fetchAdmins();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl p-6 md:p-10 border border-blue-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <FaUserShield className="text-blue-700 text-3xl" />
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">Admin User Management</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outlined" onClick={exportCSV}>Export CSV</Button>
            <Button variant="contained" color="primary" startIcon={<FaPlus />} onClick={() => setOpenAdd(true)}>
              Add Admin
            </Button>
          </div>
        </div>
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <TextField label="Search users" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} fullWidth />
          <FormControl fullWidth>
            <InputLabel id="role-filter-label">Role</InputLabel>
            <Select labelId="role-filter-label" label="Role" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
              <MenuItem value="super">Super Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="sort-by-label">Sort By</InputLabel>
            <Select labelId="sort-by-label" label="Sort By" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="role">Role</MenuItem>
            </Select>
          </FormControl>
        </div>
        {/* Admin Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Paper elevation={2} className="p-4 flex items-center gap-3">
            <FaUsers className="text-blue-500 text-2xl" />
            <div>
              <Typography variant="subtitle2">Total Admins</Typography>
              <Typography variant="h6">{stats.total}</Typography>
            </div>
          </Paper>
          <Paper elevation={2} className="p-4 flex items-center gap-3">
            <FaCrown className="text-yellow-500 text-2xl" />
            <div>
              <Typography variant="subtitle2">Super Admins</Typography>
              <Typography variant="h6">{stats.superAdmins}</Typography>
            </div>
          </Paper>
          <Paper elevation={2} className="p-4 flex items-center gap-3">
            <FaUserEdit className="text-green-500 text-2xl" />
            <div>
              <Typography variant="subtitle2">Staff Admins</Typography>
              <Typography variant="h6">{stats.staff}</Typography>
            </div>
          </Paper>
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <CircularProgress />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-blue-50">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-blue-900 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((admin) => (
                  <tr key={admin.username} className="hover:bg-blue-50">
                    <td className="px-4 py-2 whitespace-nowrap">{admin.first_name} {admin.last_name}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{admin.email}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {admin.is_super_admin || admin.is_superuser ? (
                        <Chip label="Super Admin" color="warning" size="small" icon={<FaCrown />} />
                      ) : (
                        <Chip label="Staff Admin" color="primary" size="small" icon={<FaUserShield />} />
                      )}
                    </td>
                    <td className="px-4 py-2 flex gap-2">
                      {admin.is_super_admin || admin.is_superuser ? (
                        <>
                          <Tooltip title="Super Admins cannot be edited">
                            <span>
                              <IconButton color="primary" disabled>
                                <FaUserEdit />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Super Admins cannot be deleted">
                            <span>
                              <IconButton color="error" disabled>
                                <FaTrash />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      ) : (
                        <>
                          <Tooltip title="Edit Admin">
                            <span>
                              <IconButton color="primary" onClick={() => handleEditOpen(admin)} disabled={!isActingSuperAdmin}>
                                <FaUserEdit />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete Admin">
                            <span>
                              <IconButton
                                color="error"
                                onClick={() => handleDeleteAdmin(admin.user_id)}
                                disabled={!isActingSuperAdmin || deleteLoading === admin.user_id}
                              >
                                {deleteLoading === admin.user_id ? <CircularProgress size={20} /> : <FaTrash />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between items-center py-3">
              <FormControl size="small">
                <InputLabel id="page-size-label">Rows</InputLabel>
                <Select labelId="page-size-label" label="Rows" value={pageSize} onChange={e => { setPageSize(e.target.value); setPage(1); }}>
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                </Select>
              </FormControl>
              <Pagination count={totalPages} page={currentPage} onChange={(_, p) => setPage(p)} color="primary" />
            </div>
          </div>
        )}
      </div>

      {/* Edit Admin Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Admin</DialogTitle>
        <DialogContent className="flex flex-col gap-4 min-w-[300px]">
          <TextField
            label="First Name"
            value={editForm.first_name}
            onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Last Name"
            value={editForm.last_name}
            onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Email"
            type="email"
            value={editForm.email}
            onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
            fullWidth
            required
          />
          <Box className="flex items-center gap-2 mt-2">
            <Chip
              label="Super Admin"
              color={editForm.is_super_admin ? "warning" : "default"}
              icon={<FaCrown />}
              clickable={isActingSuperAdmin}
              onClick={isActingSuperAdmin ? () => setEditForm(f => ({ ...f, is_super_admin: !f.is_super_admin })) : undefined}
            />
            <Typography variant="caption">(Toggle super admin status {isActingSuperAdmin ? '' : '— super admin only'})</Typography>
          </Box>
          {editError && <div className="text-red-500 text-sm mt-2">{editError}</div>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} color="secondary">Cancel</Button>
          <Button onClick={handleEditAdmin} color="primary" variant="contained" disabled={editLoading} startIcon={<FaSave />}>
            {editLoading ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)}>
        <DialogTitle>Add New Admin</DialogTitle>
        <DialogContent className="flex flex-col gap-4 min-w-[300px]">
          <TextField
            label="First Name"
            value={addForm.first_name}
            onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Last Name"
            value={addForm.last_name}
            onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Email"
            type="email"
            value={addForm.email}
            onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Password"
            type="password"
            value={addForm.password}
            onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
            fullWidth
            required
          />
          <Box className="flex items-center gap-2 mt-2">
            <Chip
              label="Super Admin"
              color={addForm.is_super_admin ? "warning" : "default"}
              icon={<FaCrown />}
              clickable={isActingSuperAdmin}
              onClick={isActingSuperAdmin ? () => setAddForm(f => ({ ...f, is_super_admin: !f.is_super_admin })) : undefined}
            />
            <Typography variant="caption">(Toggle to add as super admin {isActingSuperAdmin ? '' : '— super admin only'})</Typography>
          </Box>
          {addError && <div className="text-red-500 text-sm mt-2">{addError}</div>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)} color="secondary">Cancel</Button>
          <Button onClick={handleAddAdmin} color="primary" variant="contained" disabled={addLoading}>
            {addLoading ? <CircularProgress size={20} /> : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserManagement;
