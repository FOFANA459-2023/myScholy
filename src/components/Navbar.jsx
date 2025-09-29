
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { apiService } from "../services/api";
import Logo from "../assets/Logo.jpg";
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import { FaHome, FaGraduationCap, FaSignOutAlt, FaUserCircle, FaChalkboardTeacher } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { HiMenu } from 'react-icons/hi';

const baseURL = import.meta.env.BASE_URL || "/";

function Navbar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [user, setUser] = useState(() => apiService.getCurrentUser());
  const [userRole, setUserRole] = useState(() => {
    const userData = apiService.getCurrentUser();
    if (userData) {
      if (userData.user_type === 'admin' || userData.is_staff || userData.is_superuser) {
        return 'admin';
      } else {
        return 'student';
      }
    }
    return null;
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthChange = () => {
      const userData = apiService.getCurrentUser();
      setUser(userData);
      if (userData) {
        if (userData.user_type === 'admin' || userData.is_staff || userData.is_superuser) {
          setUserRole('admin');
        } else {
          setUserRole('student');
        }
      } else {
        setUserRole(null);
      }
    };
    const interval = setInterval(handleAuthChange, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      setUserRole(null);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  // Navigation links for students and admins
  const navLinks = [
    { to: "/", label: "Home", icon: <FaHome /> },
    { to: "/scholarship-list", label: "Scholarships", icon: <FaGraduationCap /> },
  ];
  const adminLinks = [
    { to: "/admin-dashboard", label: "Dashboard", icon: <MdDashboard /> },
  ];

  return (
    <AppBar position="sticky" className="bg-gradient-to-b from-blue-900 to-yellow-600 shadow-lg !bg-opacity-100">
      <Toolbar className="flex justify-between items-center">
        {/* Logo and brand */}
        <Link to="/" className="flex items-center gap-2">
          <Avatar src={Logo} alt="MyScholy Logo" sx={{ width: 48, height: 48, border: '2px solid #FFD600' }} />
          <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg">MyScholy</span>
          {userRole === 'admin' && (
            <span className="ml-2 px-2 py-1 text-xs font-bold uppercase bg-yellow-400 text-blue-900 rounded shadow-sm animate-pulse">Admin</span>
          )}
        </Link>

        {/* Desktop navigation links */}
        <div className="hidden md:flex flex-1 justify-center items-center gap-2">
          {navLinks.map((link) => (
            <Button
              key={link.to}
              component={Link}
              to={link.to}
              color="inherit"
              startIcon={link.icon}
              className={`capitalize font-semibold rounded-lg px-4 py-2 ${location.pathname === link.to ? 'bg-yellow-400 text-blue-900' : 'hover:bg-yellow-400 hover:text-blue-900'} transition-colors`}
              sx={{ textTransform: 'none' }}
            >
              {link.label}
            </Button>
          ))}
          {userRole === 'admin' && adminLinks.map((link) => (
            <Button
              key={link.to}
              component={Link}
              to={link.to}
              color="inherit"
              startIcon={link.icon}
              className={`capitalize font-semibold rounded-lg px-4 py-2 ${location.pathname === link.to ? 'bg-yellow-400 text-blue-900' : 'hover:bg-yellow-400 hover:text-blue-900'} transition-colors`}
              sx={{ textTransform: 'none' }}
            >
              {link.label}
            </Button>
          ))}
        </div>

        {/* User info and actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {userRole === 'student' && (
                <span className="hidden md:inline text-white font-semibold bg-blue-900/60 px-3 py-1 rounded-full shadow">Hello, {user.fullname?.split(' ')[0] || user.first_name || 'Student'}</span>
              )}
              <Tooltip title="Account">
                <IconButton onClick={handleMenuOpen} color="inherit">
                  <FaUserCircle className="w-7 h-7 text-yellow-400" />
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => { handleLogout(); handleMenuClose(); }}>
                  <FaSignOutAlt className="mr-2" /> Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button component={Link} to="/login" color="inherit" className="bg-white/20 border border-white/30 text-white font-semibold rounded-lg shadow hover:bg-white/40 hover:text-blue-900 transition-colors" sx={{ textTransform: 'none', px: 3, py: 1 }}>
                Login
              </Button>
              <Button component={Link} to="/signup" color="inherit" className="bg-blue-100 border border-blue-300 text-blue-900 font-semibold rounded-lg shadow hover:bg-yellow-400 hover:text-blue-900 transition-colors" sx={{ textTransform: 'none', px: 3, py: 1 }}>
                Signup
              </Button>
            </>
          )}
          {/* Mobile menu button: only show for admin and on mobile */}
          {/* Show menu icon only for admin and only on mobile (md:hidden) */}
          {userRole === 'admin' && (
            <>
              <span className="md:hidden">
                <IconButton edge="end" color="inherit" onClick={handleMenuOpen}>
                  <HiMenu className="w-7 h-7 text-white" />
                </IconButton>
              </span>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl) && window.innerWidth < 768} onClose={handleMenuClose}>
                {navLinks.map((link) => (
                  <MenuItem key={link.to} component={Link} to={link.to} onClick={handleMenuClose} selected={location.pathname === link.to}>
                    {link.icon} <span className="ml-2">{link.label}</span>
                  </MenuItem>
                ))}
                {adminLinks.map((link) => (
                  <MenuItem key={link.to} component={Link} to={link.to} onClick={handleMenuClose} selected={location.pathname === link.to}>
                    {link.icon} <span className="ml-2">{link.label}</span>
                  </MenuItem>
                ))}
                {user ? (
                  <MenuItem onClick={() => { handleLogout(); handleMenuClose(); }}>
                    <FaSignOutAlt className="mr-2" /> Logout
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem component={Link} to="/login" onClick={handleMenuClose}>Login</MenuItem>
                    <MenuItem component={Link} to="/signup" onClick={handleMenuClose}>Signup</MenuItem>
                  </>
                )}
              </Menu>
            </>
          )}
        </div>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;