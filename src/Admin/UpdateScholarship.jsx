import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { useParams, useNavigate } from "react-router-dom";
import NavigationButtons from "../components/NavigationButtons";
import { Snackbar, Alert } from "@mui/material";

const UpdateScholarship = () => {
  const { id } = useParams(); // Get the scholarship ID from the URL
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
    host_country: "",
    benefits: "",
    eligibility: "",
    degree_level: "",
    link: "",
    author: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check admin access and fetch scholarship details
  useEffect(() => {
    const user = apiService.getCurrentUser();
    if (
      !user ||
      (user.user_type !== "admin" && !user.is_staff && !user.is_superuser)
    ) {
      setError("Access denied: Only admins can update scholarships.");
      setLoading(false);
      return;
    }

    const fetchScholarship = async () => {
      try {
        const { data, error } = await apiService.getAdminScholarship(id);
        if (error) throw new Error(error);

        // Format the deadline for the date input
        if (data.deadline) {
          data.deadline = new Date(data.deadline).toISOString().split("T")[0];
        }

        setFormData(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
    fetchScholarship();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) errors.name = "Scholarship name is required.";
    if (!formData.description?.trim())
      errors.description = "Description is required.";
    if (!formData.deadline) errors.deadline = "Deadline is required.";
    if (!formData.host_country?.trim())
      errors.host_country = "Host country is required.";
    if (!formData.benefits?.trim()) errors.benefits = "Benefits are required.";
    if (!formData.eligibility?.trim())
      errors.eligibility = "Eligibility criteria are required.";
    if (!formData.degree_level?.trim())
      errors.degree_level = "Degree level is required.";
    if (!formData.link?.trim()) errors.link = "Link is required.";
    if (!formData.author?.trim()) errors.author = "Author is required.";

    if (formData.deadline) {
      const today = new Date().toISOString().split("T")[0];
      if (formData.deadline < today) {
        errors.deadline = "Deadline must be a future date.";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      setSnackbar({
        open: true,
        message: firstError,
        severity: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await apiService.updateAdminScholarship(
        id,
        formData,
      );
      if (error) throw new Error(error);

      setSnackbar({
        open: true,
        message: data?.message || "Scholarship updated successfully!",
        severity: "success",
      });

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/admin-scholarship-list");
      }, 1500);
    } catch (error) {
      console.error("Error updating scholarship:", error);
      setSnackbar({
        open: true,
        message:
          error.message || "Failed to update scholarship. Please try again.",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg text-gray-600">Loading scholarship details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-lg text-red-500 mb-4">Error: {error}</p>
        {error.includes("Access denied") ? (
          <button
            onClick={() => navigate("/admin-login")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        ) : (
          <button
            onClick={() => navigate("/admin-scholarship-list")}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to List
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto">
          <NavigationButtons showBack={true} showHome={false} />
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Update Scholarship
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Scholarship Name */}
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="name"
                >
                  Scholarship Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter scholarship name"
                  required
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter scholarship description"
                  rows="4"
                  required
                />
              </div>

              {/* Deadline */}
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="deadline"
                >
                  Deadline
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              {/* Host Country */}
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="host_country"
                >
                  Host Country
                </label>
                <input
                  type="text"
                  id="host_country"
                  name="host_country"
                  value={formData.host_country}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter host country"
                  required
                />
              </div>

              {/* Benefits */}
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="benefits"
                >
                  Benefits
                </label>
                <textarea
                  id="benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter scholarship benefits"
                  rows="4"
                  required
                />
              </div>

              {/* Eligibility */}
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="eligibility"
                >
                  Eligibility
                </label>
                <textarea
                  id="eligibility"
                  name="eligibility"
                  value={formData.eligibility}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter eligibility criteria"
                  rows="4"
                  required
                />
              </div>

              {/* Degree Level */}
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="degree_level"
                >
                  Degree Level
                </label>
                <input
                  type="text"
                  id="degree_level"
                  name="degree_level"
                  value={formData.degree_level}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter degree level"
                  required
                />
              </div>

              {/* Link */}
              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="link"
                >
                  Application Link
                </label>
                <input
                  type="text"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter application link"
                  required
                />
              </div>

              {/* Author */}
              <div className="mb-6">
                <label
                  className="block text-gray-700 text-sm font-bold mb-2"
                  htmlFor="author"
                >
                  Author
                </label>
                <input
                  type="text"
                  id="author"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter author name"
                  required
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                    isSubmitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-700"
                  } text-white`}
                >
                  {isSubmitting ? "Updating..." : "Update Scholarship"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin-scholarship-list")}
                  className="bg-gray-500 text-white font-bold py-2 px-4 rounded hover:bg-gray-700 focus:outline-none focus:shadow-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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

export default UpdateScholarship;
