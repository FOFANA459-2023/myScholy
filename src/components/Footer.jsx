import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaPhone, FaEnvelope } from "react-icons/fa";

const Footer = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // TODO: Replace with backend contact endpoint when available.
      await new Promise((r) => setTimeout(r, 500));
      setSubmitSuccess(true);
      setFormData({ name: "", email: "", message: "" });
      setErrors({});
    } catch (error) {
      setSubmitError("Failed to submit form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-blue-900 to-yellow-600 text-white py-12">
      <div className="container mx-auto px-6">
        {/* Footer Content - Flex Layout */}
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Left Side - Text Sections */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Quick Links */}
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/scholarship-list"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    Scholarships
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    Exam Prep
                  </Link>
                </li>
                <li>
                  <Link
                    to="/whatsapp-invite"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    Join Our WhatsApp Community
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Our Programs and Services */}
            <div>
              <h3 className="text-xl font-bold mb-4">
                Our Programs and Services
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    Exam Prep (SAT, ACT, GRE, TOEFL, IELTS)
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    Essay Proofreading & Editing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    Application Assistance
                  </Link>
                </li>
              </ul>
            </div>

            {/* Get in Touch */}
            <div>
              <h3 className="text-xl font-bold mb-4">Get in Touch</h3>
              <div className="space-y-4">
                {/* Phone */}
                <div className="flex items-center space-x-2">
                  <FaPhone className="w-5 h-5" />
                  <a
                    href="tel:+1234567890"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    +1 (234) 567-890
                  </a>
                </div>

                {/* Email */}
                <div className="flex items-center space-x-2">
                  <FaEnvelope className="w-5 h-5" />
                  <a
                    href="mailto:info@myscholy.com"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    info@myscholy.com
                  </a>
                </div>

                {/* Social Media Links */}
                <div className="flex space-x-4">
                  <a
                    href="https://www.facebook.com/yourpage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    <FaFacebook className="w-6 h-6" />
                  </a>
                  <a
                    href="https://www.instagram.com/yourpage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    <FaInstagram className="w-6 h-6" />
                  </a>
                  <a
                    href="https://www.linkedin.com/yourpage"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-yellow-500 transition-colors duration-300"
                  >
                    <FaLinkedin className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className="w-full md:w-1/3">
            <div className="bg-transparent p-6 rounded-lg shadow-md border border-white border-opacity-20 backdrop-filter backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">Contact Us</h3>
              {submitSuccess && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
                  Message submitted successfully! An admin will reach out to you shortly.
                </div>
              )}
              {submitError && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                  {submitError}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-transparent border border-white border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white text-white placeholder-white placeholder-opacity-70 transition-all"
                    placeholder="Name"
                    required
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>
                <div className="mb-4">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-transparent border border-white border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white text-white placeholder-white placeholder-opacity-70 transition-all"
                    placeholder="Email"
                    required
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div className="mb-4">
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 bg-transparent border border-white border-opacity-30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white focus:border-white text-white placeholder-white placeholder-opacity-70 transition-all"
                    placeholder="Message"
                    required
                  />
                  {errors.message && (
                    <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-yellow-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 transition-all"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Copyright Notice */}
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} myScholy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;