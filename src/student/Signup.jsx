import { useState, useEffect } from "react";
import { Snackbar, Alert } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/api";

const Signup = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    nationality: "",
    country_of_residence: "",
    user_type: "student", // Always set to student
  });

  const [errors, setErrors] = useState({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Prevent user_type from being changed by user
    if (name === "user_type") return;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
      user_type: "student", // Always enforce student role
    }));
  };

  // Validate form inputs
  const validateForm = () => {
    let tempErrors = {};
    if (!formData.fullname.trim() || formData.fullname.trim().split(' ').length < 2) {
      tempErrors.fullname = "Please enter your full name (at least two names).";
    }
    if (!formData.email) {
      tempErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      tempErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.phone) {
      tempErrors.phone = "Phone number is required";
    } else {
      // Accept international format starting with + and country code (E.164-like)
      const cleaned = formData.phone.replace(/[\s-()]/g, "");
      // Basic E.164 validation: + followed by 8-15 digits
      if (!/^\+\d{8,15}$/.test(cleaned)) {
        tempErrors.phone = "Please enter your phone number in international format, starting with + and country code (e.g. +2348012345678).";
      }
    }
    if (!formData.nationality) {
      tempErrors.nationality = "Nationality is required";
    }
    if (!formData.country_of_residence) {
      tempErrors.country_of_residence = "Country of residence is required";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Always enforce student role before submit
    setFormData((prevData) => ({ ...prevData, user_type: "student" }));
    if (validateForm()) {
      try {
        setIsLoading(true);

        // Split fullname into first and last name
        const nameParts = formData.fullname.trim().split(' ');
        const first_name = nameParts[0] || '';
        const last_name = nameParts.slice(1).join(' ') || '';

        // Prepare payload for backend
        const payload = {
          user: {
            username: formData.email,
            email: formData.email,
            password: formData.password,
            first_name,
            last_name
          },
          phone: formData.phone,
          nationality: formData.nationality,
          country_of_residence: formData.country_of_residence
        };

        const { data: regData, error: regError } = await apiService.registerStudent(payload);
        if (regError) {
          setErrors({ api: regError });
          setSnackbar({ open: true, message: regError, severity: "error" });
          setIsSuccess(false);
        } else {
          setIsSuccess(true);
          setSnackbar({ open: true, message: "Account created successfully!", severity: "success" });
          setTimeout(() => {
            navigate("/login");
          }, 1500);
        }

      } catch (error) {
        console.error("Error during signup:", error.message);
        if (error.message.includes("duplicate") || error.message.includes("already exists")) {
          setErrors(prev => ({
            ...prev,
            submit: "This email is already registered."
          }));
          setSnackbar({ open: true, message: "This email is already registered.", severity: "error" });
        } else {
          setErrors(prev => ({
            ...prev,
            submit: error.message
          }));
          setSnackbar({ open: true, message: error.message || "Signup failed", severity: "error" });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Redirect to login after 5 seconds
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate("/login");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, navigate]);

  // Social signups disabled (Supabase removed)
  const signUpWithGoogle = async () => setErrors({ submit: "Google signup is temporarily unavailable." });

  const signUpWithFacebook = async () => setErrors({ submit: "Facebook signup is temporarily unavailable." });

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {isSuccess ? (
            <div className="text-center">
              <h3 className="text-2xl font-bolds text-sky-600">Thank you for signing up!</h3>
              <p className="mt-4 text-gray-600">
                You will be redirected to the login page in 5 seconds...
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="fullname" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="fullname"
                    name="fullname"
                    type="text"
                    placeholder="e.g. John Doe"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.fullname}
                    onChange={handleChange}
                  />
                  {errors.fullname && (
                    <p className="mt-1 text-sm text-red-600">{errors.fullname}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="e.g. myscholy@gmail.com"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+234 801 234 5678"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">
                  Nationality
                </label>
                <div className="mt-1">
                  <input
                    id="nationality"
                    name="nationality"
                    type="text"
                    placeholder="e.g. Liberian"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.nationality}
                    onChange={handleChange}
                  />
                  {errors.nationality && (
                    <p className="mt-1 text-sm text-red-600">{errors.nationality}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="country_of_residence" className="block text-sm font-medium text-gray-700">
                  Country of Residence
                </label>
                <div className="mt-1">
                  <input
                    id="country_of_residence"
                    name="country_of_residence"
                    type="text"
                    placeholder="e.g. Liberia"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.country_of_residence}
                    onChange={handleChange}
                  />
                  {errors.country_of_residence && (
                    <p className="mt-1 text-sm text-red-600">{errors.country_of_residence}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Must be at least 6 characters"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Must match the password above"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {errors.submit && (
                <div className="text-red-600 text-sm text-center">
                  {errors.submit}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isLoading ? "Creating Account..." : "Sign up"}
                </button>
              </div>
            </form>
          )}

          {!isSuccess && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={signUpWithGoogle}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <img
                    src="https://www.google.com/favicon.ico"
                    alt="Google"
                    className="h-5 w-5 mr-2"
                  />
                  Google
                </button>

                <button
                  type="button"
                  onClick={signUpWithFacebook}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <img
                    src="https://www.facebook.com/favicon.ico"
                    alt="Facebook"
                    className="h-5 w-5 mr-2"
                  />
                  Facebook
                </button>
              </div>

              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Already have an account?
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to="/login"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    <Snackbar
      open={snackbar.open}
      autoHideDuration={4000}
      onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
};

export default Signup;