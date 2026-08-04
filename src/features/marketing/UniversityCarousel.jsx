import React, { useCallback, useEffect, useRef, useState } from "react";

import ALA from "../../assets/ALA.jpg";
import ALCHE from "../../assets/ALCHE.jpg";
import ALU from "../../assets/ALU.jpg";
import APU from "../../assets/APU.jpg";
import Caltech from "../../assets/Caltech.jpg";
import Harvard from "../../assets/Harvard.jpg";
import MIT from "../../assets/MIT.jpg";
import Pretoria from "../../assets/Pretoria.jpg";
import Princeton from "../../assets/Princeton.jpg";
import Stanford from "../../assets/Stanford.jpg";
import UCT from "../../assets/UCT.jpg";
import Yale from "../../assets/Yale.jpg";

const UNIVERSITIES = [
  {
    name: "African Leadership Academy",
    image: ALA,
    info: "A leadership development institution for young African leaders.",
  },
  {
    name: "African Leadership University",
    image: ALU,
    info: "A pan-African university with campuses in Rwanda and Mauritius.",
  },
  {
    name: "Ritsumeikan Asia Pacific University",
    image: APU,
    info: "A leading international university in Japan, offering bilingual education.",
  },
  {
    name: "Harvard University",
    image: Harvard,
    info: "Admission rate 5%. SAT range 1460-1580. Rigorous academics and a strong alumni network.",
  },
  {
    name: "Stanford University",
    image: Stanford,
    info: "Admission rate 4%. SAT range 1440-1570. Renowned for innovation and entrepreneurship.",
  },
  {
    name: "Massachusetts Institute of Technology",
    image: MIT,
    info: "Admission rate 7%. SAT range 1500-1570. A leader in science, technology and engineering.",
  },
  {
    name: "California Institute of Technology",
    image: Caltech,
    info: "Admission rate 6%. SAT range 1530-1580. Focused on science and engineering.",
  },
  {
    name: "Princeton University",
    image: Princeton,
    info: "Admission rate 6%. SAT range 1460-1570. Known for its undergraduate focus.",
  },
  {
    name: "Yale University",
    image: Yale,
    info: "Admission rate 6%. SAT range 1460-1570. A strong liberal arts education.",
  },
  {
    name: "University of Cape Town",
    image: UCT,
    info: "Ranked first in Africa, known for research output and a striking campus.",
  },
  {
    name: "University of Pretoria",
    image: Pretoria,
    info: "One of South Africa's top universities, with a wide range of programs.",
  },
  {
    name: "African Leadership College of Higher Education",
    image: ALCHE,
    info: "Part of ALU, focusing on leadership and entrepreneurship.",
  },
];

const INTERVAL = 2000;
const COUNT = UNIVERSITIES.length;

/**
 * The track is every university plus a clone of the first slide at the end,
 * so the loop is seamless: the wrap animates forward into the clone (which is
 * pixel-identical to slide one), then snaps back to the real first slide with
 * the transition disabled. The snap moves between two identical frames, so
 * nothing visibly restarts. Going backwards from the first slide uses the
 * same trick in reverse.
 */
const SLIDES = [...UNIVERSITIES, UNIVERSITIES[0]];

/**
 * Auto-advancing slideshow.
 *
 * `index` runs 0..COUNT where COUNT is the clone; `active` is the university
 * actually on screen and drives the dots and aria state.
 */
export default function UniversityCarousel() {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef(null);

  const active = index % COUNT;

  /** Instant, invisible jump: transition off, move, transition back on. */
  const snapTo = useCallback((position, thenGo) => {
    setAnimate(false);
    setIndex(position);
    // Two frames: the first paints the snapped position, the second may
    // re-enable the transition and start the real slide.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimate(true);
        if (thenGo !== undefined) setIndex(thenGo);
      });
    });
  }, []);

  const next = useCallback(() => {
    // Mid-reset (already on the clone): ignore until the snap completes.
    setIndex((i) => (i >= COUNT ? i : i + 1));
  }, []);

  const prev = useCallback(() => {
    if (index === 0) snapTo(COUNT, COUNT - 1);
    else setIndex(index - 1);
  }, [index, snapTo]);

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [paused, next]);

  // Landing on the clone schedules the invisible reset to the real slide one.
  // A timeout rather than transitionend: the browser skips transitions (and
  // their end events) in hidden tabs and under prefers-reduced-motion, and
  // the reset must happen regardless.
  useEffect(() => {
    if (index !== COUNT) return undefined;
    const timer = setTimeout(() => snapTo(0), 750);
    return () => clearTimeout(timer);
  }, [index, snapTo]);

  // Pause while off-screen so a backgrounded tab is not repainting.
  useEffect(() => {
    const node = regionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setPaused(!entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-brand-wash py-14" aria-label="Featured universities">
      <div className="container">
        <h2 className="mb-8 text-center text-2xl font-bold text-white sm:text-3xl">
          Where our students are headed
        </h2>

        <div
          ref={regionRef}
          className="relative overflow-hidden rounded-2xl shadow-card-hover"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className={`flex ${animate ? "transition-transform duration-700 ease-out" : ""}`}
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {SLIDES.map((university, position) => (
              <div
                // The clone repeats the first name, so key on position too.
                key={`${university.name}-${position}`}
                className="relative h-[18rem] w-full shrink-0 sm:h-[24rem]"
                aria-hidden={position !== index}
              >
                <img
                  src={university.image}
                  alt={university.name}
                  loading={position <= 1 ? "eager" : "lazy"}
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-white sm:text-2xl">
                    {university.name}
                  </h3>
                  <p className="mt-1.5 max-w-2xl text-sm text-white/85">{university.info}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={prev}
            aria-label="Previous university"
            className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition-colors hover:bg-white/40"
          >
            <span aria-hidden="true">&#8249;</span>
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next university"
            className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/25 text-white backdrop-blur transition-colors hover:bg-white/40"
          >
            <span aria-hidden="true">&#8250;</span>
          </button>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {UNIVERSITIES.map((university, position) => (
            <button
              key={university.name}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Show ${university.name}`}
              aria-current={position === active}
              className={`h-2 rounded-full transition-all ${
                position === active ? "w-7 bg-white" : "w-2 bg-white/45 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
