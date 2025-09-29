import React from "react";
import { Link, useNavigate } from "react-router-dom";

function ProgramsNservices() {
  const navigate = useNavigate();

  const handleBookingClick = () => {
    navigate("/");
  };

  return (
    <div className="bg-gradient-to-br from-sky-900 via-blue-800 to-yellow-500 min-h-screen py-20">
      <section id="services" className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-white drop-shadow-lg">
          Our Programs and Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Exam Prep */}
          <div className="bg-white/80  text-sky-900 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105">
            <h3 className="text-2xl font-bold mb-4">Expert Exam Preparation</h3>
            <p className="mb-4">
              Boost your test scores with our comprehensive prep programs. Get personalized coaching for SAT, ACT, GRE, TOEFL, and IELTS.
            </p>
            <div className="flex justify-between items-center">
              <Link to="https://tutorants.com/">
                <button className="bg-sky-900 text-white px-6 py-2 rounded-lg hover:bg-black hover:text-white transition-all">
                  Start Prep Now
                </button>
              </Link>
            </div>
          </div>

          {/* Essay Editing */}
          <div className="bg-white/80 text-sky-900 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105">
            <h3 className="text-2xl font-bold mb-4">Essay Proofreading & Editing</h3>
            <p className="mb-4">
              Get expert editing to perfect your writing. We provide detailed feedback, grammar enhancement, and strategic recommendations.
            </p>
            <div className="flex justify-between items-center">
              <button
                onClick={handleBookingClick}
                className="bg-sky-900 text-white px-6 py-2 rounded-lg hover:bg-black hover:text-white transition-all"
              >
                Perfect Your Essay
              </button>
            </div>
          </div>

          {/* Application Assistance */}
          <div className="bg-white/80 text-sky-900 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105">
            <h3 className="text-2xl font-bold mb-4">Premium Application Assistance</h3>
            <p className="mb-4">
              Get expert guidance on personal statements, resume building, and crafting compelling applications.
            </p>
            <div className="flex justify-between items-center">
              <button
                onClick={handleBookingClick}
                className="bg-sky-900 text-white px-6 py-2 rounded-lg hover:bg-black hover:text-white transition-all"
              >
                Get Expert Help
              </button>
            </div>
          </div>

          {/* WhatsApp Community */}
          <div className="bg-white/80 text-sky-900 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105">
            <h3 className="text-2xl font-bold mb-4">Join our WhatsApp Channel</h3>
            <p className="mb-4">
              Stay connected with our vibrant WhatsApp community! Get real-time updates, tips, and exclusive content.
            </p>
            <div className="flex justify-between items-center">
              <Link to="/whatsapp-invite">
                <button className="bg-sky-900 text-white px-6 py-2 rounded-lg hover:bg-black hover:text-white transition-all">
                  Join Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ProgramsNservices;
