import React from "react";
import { Link } from "react-router-dom";
import ProgramsNservices from "../pages/ProgramsNservices.jsx";
import FAQ from "../pages/FAQ.jsx";
import UniversityCarousel from "../pages/UniversityCarousel.jsx";
import admissionPhoto from "../assets/admission.jpg";
import myScholyCoverVideo from "../assets/myScholyCoverVideo.mp4";

const CTAButton = ({ text, to }) => (
  <Link to={to}>
    <button className="bg-sky-900 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-lg text-lg sm:text-xl hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-105 shadow-lg">
      {text}
    </button>
  </Link>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen text-white">
      {/* Hero Section */}
      <header className="relative w-full h-[70vh] md:h-[80vh] flex items-center justify-center overflow-hidden bg-black">
        <video
          className="absolute inset-0 w-full h-full object-cover object-center"
          src={myScholyCoverVideo}
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-6 left-6 right-6 sm:right-auto max-w-2xl px-4 sm:px-6 py-4 sm:py-5 bg-black/30 backdrop-blur-[2px] rounded-xl shadow-lg ring-1 ring-white/10 text-left">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3 sm:mb-4 text-white drop-shadow">
            Empowering students through scholarships
          </h1>
          <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-5 text-white/90">
            Discover scholarships, grants, and opportunities to achieve your
            academic and career goals.
          </p>
          <div className="flex">
            <CTAButton text="Explore Scholarships" to="/scholarship-list" />
          </div>
        </div>
      </header>

      {/* About Section (Redesigned) */}
      <section id="about" className="bg-white text-sky-900 py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Visual */}
            <div className="order-2 lg:order-1">
              <img
                src={admissionPhoto}
                alt="Students celebrating admissions"
                className="rounded-2xl shadow-2xl w-full max-w-xl mx-auto ring-1 ring-sky-100 hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
            {/* Copy */}
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">About MyScholy</h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                We connect ambitious students with curated scholarships and resources. Our platform blends
                expert curation with an intuitive discovery experience, helping you move from searching to applying—faster.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-sky-50 rounded-xl p-4 shadow">
                  <p className="text-3xl font-bold text-sky-700">10k+</p>
                  <p className="text-gray-600 text-sm">Scholarships listed</p>
                </div>
                <div className="bg-sky-50 rounded-xl p-4 shadow">
                  <p className="text-3xl font-bold text-sky-700">120+</p>
                  <p className="text-gray-600 text-sm">Countries covered</p>
                </div>
                <div className="bg-sky-50 rounded-xl p-4 shadow">
                  <p className="text-3xl font-bold text-sky-700">50k+</p>
                  <p className="text-gray-600 text-sm">Students reached</p>
                </div>
                <div className="bg-sky-50 rounded-xl p-4 shadow">
                  <p className="text-3xl font-bold text-sky-700">24/7</p>
                  <p className="text-gray-600 text-sm">Active community</p>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <CTAButton text="Explore Scholarships" to="/scholarship-list" />
                <CTAButton text="Join Community" to="/whatsapp-invite" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gradient-to-br from-sky-50 to-white text-sky-900 py-14">
        <div className="container mx-auto px-4 sm:px-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-center mb-10">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sky-700 font-bold">1. Discover</div>
              <p className="text-gray-600 mt-2">Browse curated scholarships tailored to your background, degree level, and country.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sky-700 font-bold">2. Shortlist</div>
              <p className="text-gray-600 mt-2">Filter by deadlines and requirements, then bookmark your picks.</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow">
              <div className="text-sky-700 font-bold">3. Apply</div>
              <p className="text-gray-600 mt-2">Follow the official links and submit a strong application with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* University Sliders Component (moved above WhatsApp) */}
      <UniversityCarousel />

      {/* Pilot Students (College Admission Consulting) */}
      {/* <section className="bg-white py-14"> */}
        {/* <div className="container mx-auto px-4 sm:px-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-sky-900 mb-8">Our Pilot Students</h3>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8">Meet a few of the amazing students in our pilot college admission consulting program.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Amina Yusuf', school: 'Unity High School', img: 'https://randomuser.me/api/portraits/women/65.jpg' },
              { name: 'Daniel Mensah', school: 'St. Peter’s College', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
              { name: 'Priya Kumar', school: 'Lotus Senior High', img: 'https://randomuser.me/api/portraits/women/22.jpg' },
              { name: 'James Okoro', school: 'Cedar Ridge High', img: 'https://randomuser.me/api/portraits/men/76.jpg' },
            ].map((s, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow p-4 text-center">
                <img src={s.img} alt={s.name} className="w-28 h-28 rounded-full object-cover mx-auto mb-3 shadow" />
                <div className="font-semibold text-sky-900">{s.name}</div>
                <div className="text-sm text-gray-600">{s.school}</div>
              </div>
            ))}
          </div>
        </div> */}
      {/* </section> */}

      {/* Student Stories (testimonials) */}
      {/* <section className="bg-gradient-to-br from-sky-50 to-white py-14"> */}
        {/* <div className="container mx-auto px-4 sm:px-6">
          <h3 className="text-2xl sm:text-3xl font-bold text-center text-sky-900 mb-8">Student Stories</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <img className="w-full h-40 object-cover rounded-lg mb-4" alt="Story 1" src="https://images.unsplash.com/photo-1558021211-6d1403321394?auto=format&fit=crop&w=800&q=80" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x300?text=Student+Story'; }} />
              <p className="text-gray-700">“I found a full scholarship within two weeks. The filters and alerts made it simple.”</p>
              <p className="text-sm text-gray-500 mt-2">— Amina, Undergraduate</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <img className="w-full h-40 object-cover rounded-lg mb-4" alt="Story 2" src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=800&q=80" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x300?text=Student+Story'; }} />
              <p className="text-gray-700">“Great curation of opportunities, and the community guidance is invaluable.”</p>
              <p className="text-sm text-gray-500 mt-2">— Daniel, Masters</p>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <img className="w-full h-40 object-cover rounded-lg mb-4" alt="Story 3" src="https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&w=800&q=80" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/800x300?text=Student+Story'; }} />
              <p className="text-gray-700">“I love the deadlines overview—keeps me on track with my applications.”</p>
              <p className="text-sm text-gray-500 mt-2">— Priya, PhD</p>
            </div>
          </div>
        </div> */}
      {/* </section> */}

      {/* Community CTA */}
      <section className="bg-sky-900 text-white py-14">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold mb-4">Join our WhatsApp community</h3>
          <p className="text-sky-100 max-w-2xl mx-auto mb-6">Get timely updates, tips, and peer support. Access is restricted to authenticated users.</p>
          <CTAButton text="Join on WhatsApp" to="/whatsapp-invite" />
        </div>
      </section>


      {/* Programs and Services Section */}
      <ProgramsNservices />

      {/* Frequently Asked Questions Section */}
      <FAQ />
    </div>
  );
};

export default LandingPage;
