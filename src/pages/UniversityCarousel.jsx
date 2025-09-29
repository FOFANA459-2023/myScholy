import React, { useState, useEffect } from "react";
import ALA from "../assets/ALA.jpg";
import ALU from "../assets/ALU.jpg";
import APU from "../assets/APU.jpg";
import Harvard from "../assets/Harvard.jpg";
import Stanford from "../assets/Stanford.jpg";
import MIT from "../assets/MIT.jpg";
import Caltech from "../assets/Caltech.jpg";
import Princeton from "../assets/Princeton.jpg";
import Yale from "../assets/Yale.jpg";
import UCT from "../assets/UCT.jpg";
import Pretoria from "../assets/Pretoria.jpg";
import ALCHE from "../assets/ALCHE.jpg";

const UniversityCarousel = () => {
  const universities = [
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
      info: "Admission Rate: 5%. SAT Range: 1460-1580. Known for its rigorous academics and strong alumni network.",
    },
    {
      name: "Stanford University",
      image: Stanford,
      info: "Admission Rate: 4%. SAT Range: 1440-1570. Renowned for innovation and entrepreneurship.",
    },
    {
      name: "Massachusetts Institute of Technology (MIT)",
      image: MIT,
      info: "Admission Rate: 7%. SAT Range: 1500-1570. A leader in science, technology, and engineering.",
    },
    {
      name: "California Institute of Technology (Caltech)",
      image: Caltech,
      info: "Admission Rate: 6%. SAT Range: 1530-1580. Known for its focus on science and engineering.",
    },
    {
      name: "Princeton University",
      image: Princeton,
      info: "Admission Rate: 6%. SAT Range: 1460-1570. Known for its undergraduate focus.",
    },
    {
      name: "Yale University",
      image: Yale,
      info: "Admission Rate: 6%. SAT Range: 1460-1570. Offers a strong liberal arts education.",
    },
    {
      name: "University of Cape Town",
      image: UCT,
      info: "Ranked #1 in Africa. Known for its research output and beautiful campus.",
    },
    {
      name: "University of Pretoria",
      image: Pretoria,
      info: "One of South Africa's top universities, offering a wide range of programs.",
    },
    {
      name: "African Leadership College of Higher Education",
      image: ALCHE,
      info: "Part of ALU, focusing on leadership and entrepreneurship.",
    },
  ];

  // Duplicate the list to create a smooth infinite loop
  const duplicatedUniversities = [...universities, ...universities];

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        // If we reach the end of the duplicated list, reset to the start without a visible jump
        if (newIndex >= duplicatedUniversities.length) {
          return 0;
        }
        return newIndex;
      });
    }, 3000);

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [duplicatedUniversities.length]);

  return (
    <div className="bg-gradient-to-b from-blue-900 to-yellow-600 text-white py-12">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center mb-8">
          Top Universities for Students
        </h2>
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(-${(currentIndex % universities.length) * 100}%)`,
            }}
          >
            {duplicatedUniversities.map((university, index) => (
              <div
                key={index}
                className="w-full flex-shrink-0 h-[400px] relative" // Fixed height for slides
              >
                {/* Background Image */}
                <img
                  src={university.image}
                  alt={university.name}
                  className="w-full h-full object-cover absolute inset-0 filter brightness-125 contrast-110" // Increased brightness and contrast
                />
                {/* Overlay Text */}
                <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-end p-6">
                  <h3 className="text-2xl font-bold text-white">
                    {university.name}
                  </h3>
                  <p className="text-white">{university.info}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversityCarousel;