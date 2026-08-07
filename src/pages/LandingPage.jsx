import React from "react";

import ALACampus from "../assets/ALACampus.jpg";
import admissionPhoto from "../assets/admission.jpg";
import { Button } from "../components/ui/index.js";
import FaqSection from "../features/marketing/FaqSection.jsx";
import RoadmapSection from "../features/marketing/RoadmapSection.jsx";
import UniversityCarousel from "../features/marketing/UniversityCarousel.jsx";

const HIGHLIGHTS = [
  { value: "Global", label: "Opportunities from every continent" },
  { value: "Free", label: "No fees, ever, to browse or apply" },
  { value: "Weekly", label: "New scholarships added regularly" },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero. The background is a real <img> rather than a CSS background so
          the browser can prioritise it as the largest contentful paint.
          `fetchpriority` is lowercase because React 18 does not map the
          camelCase form onto the DOM attribute. */}
      <header className="relative isolate flex min-h-[32rem] items-center justify-center overflow-hidden md:min-h-[38rem]">
        <img
          src={ALACampus}
          alt=""
          fetchpriority="high"
          decoding="async"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-900/75 via-ink-900/55 to-brand-950/80" />

        <div className="container py-20 text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">
            MyScholy
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Empowering students through scholarships
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/85">
            Discover scholarships, grants and opportunities to reach your academic and
            career goals - all in one place.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button to="/scholarships" size="lg" variant="gold">
              Explore scholarships
            </Button>
            <Button to="/programs" size="lg" variant="onBrand">
              See our programs
            </Button>
          </div>

          <dl className="mx-auto mt-14 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item.value}>
                <dt className="text-2xl font-bold text-gold-300">{item.value}</dt>
                <dd className="mt-1 text-sm text-white/75">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* About */}
      <section id="about" className="bg-brand-soft py-16 sm:py-20">
        <div className="container grid items-center gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <h2 className="text-3xl font-bold text-brand-900 sm:text-4xl">
              About myScholy
            </h2>
            <div className="mt-6 border-l-4 border-brand-500 pl-5 text-base leading-relaxed text-ink-700">
              <p>
                myScholy is an education platform that helps students discover
                scholarships and other educational opportunities from trusted
                sources. We know that finding the right opportunity can be
                overwhelming, so our goal is to make the process simpler and
                more reliable. Every scholarship listed on our platform is
                reviewed before publication and includes a link to the official
                application page. The scholarship board is completely free to
                use, allowing students to search, filter, and explore
                opportunities without creating an account or paying any fees.
              </p>
              <p className="mt-4">
                We&apos;re also expanding myScholy beyond the scholarship
                board. myScholy Consulting, coming soon, will offer
                personalized guidance for students who want extra support with
                their applications at an affordable price. From application
                planning and essay editing to CV reviews and interview
                preparation, our goal is to make quality guidance accessible
                to every student.
              </p>
              <p className="mt-4">
                myScholy Academy, also coming soon, will provide practical
                courses and learning resources for students who want to
                develop valuable skills beyond the classroom. Whether
                you&apos;re getting started with coding, entrepreneurship,
                writing, career development, or other in-demand skills, the
                Academy will help you learn, grow, and prepare for future
                opportunities.
              </p>
            </div>
            <div className="mt-8">
              <Button to="/scholarships" variant="primary">
                Browse the board
              </Button>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <img
              src={admissionPhoto}
              alt="Students celebrating their university admission"
              loading="lazy"
              decoding="async"
              className="w-full max-w-lg rounded-2xl shadow-card-hover"
            />
          </div>
        </div>
      </section>

      <UniversityCarousel />
      <RoadmapSection />
      {/* Programs & services deliberately does not appear here - it has its
          own page at /programs, linked from the hero, roadmap and footer. */}
      {/* The full grouped FAQ lives here now - the standalone /faq page was
          removed, and this is the only place the complete set is rendered. */}
      <FaqSection grouped />
    </>
  );
}
