import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiService from "../services/api";

const WhatsAppInvite = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track authentication state
  const [isLoading, setIsLoading] = useState(true); // Track loading state
  const [showMessage, setShowMessage] = useState(false); // Track whether to show the message
  const navigate = useNavigate();

  const whatsappLink =
    "https://chat.whatsapp.com/ITYFfCdoAiGD3rG4f4GxK8";

  // Check if the user is authenticated
  useEffect(() => {
    setIsLoading(true);
    const ok = apiService.isAuthenticated();
    if (ok) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      setShowMessage(true);
      setIsLoading(false);
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [navigate]);

  // If still loading, show a loading spinner or message
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-sky-50">
        <p className="text-xl text-gray-800">Loading...</p>
      </div>
    );
  }

  // Render the component for authenticated users
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-sky-50 p-6">
      {/* Message for unauthenticated users */}
      {showMessage && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-100 p-4 text-center text-yellow-800 font-semibold">
          You need to sign up or login to access the WhatsApp channel. Redirecting to login...
        </div>
      )}

      {/* Main content for authenticated users */}
      {isAuthenticated && (
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-2xl w-full border border-gray-100">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Welcome to Our Community!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We’re thrilled to invite you to join our vibrant WhatsApp group. This
            is your chance to connect with like-minded individuals, share ideas,
            and stay updated on the latest news and events.
          </p>
          <p className="text-lg text-gray-600 mb-8">
            Whether you're here to learn, collaborate, or simply network, our
            community is the perfect place for you. Don’t miss out on the fun and
            opportunities!
          </p>
          <div className="mb-8">
            <p className="text-lg text-gray-600">
              Ready to join? Click the button below to become a part of our
              growing family!
            </p>
          </div>
          <Link
            to={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#25D366] text-white font-bold text-xl py-4 px-10 rounded-2xl hover:bg-[#1DA851] transition duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Join WhatsApp Group
          </Link>
          <p className="text-sm text-gray-500 mt-6">
            By joining, you agree to our{" "}
            <a href="/terms" className="text-green-600 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-green-600 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
};

export default WhatsAppInvite;