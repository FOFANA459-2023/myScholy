import React from "react";

const ProgramsNservices = () => {
  const roadmapSteps = [
    {
      title: "Eligibility/Fit Assessment",
      description: "We start by assessing your eligibility and finding the right programs and scholarships that match your profile and aspirations.",
    },
    {
      title: "Onboarding Workshop",
      description: "An initial workshop to onboard you onto our platform and processes, ensuring you are well-prepared for the application journey.",
    },
    {
      title: "Document Submission",
      description: "You will submit all the required documents through our secure portal. We will review them to ensure everything is in order.",
    },
    {
      title: "Create Application Portal",
      description: "We will help you create and set up your application portals for the selected universities and scholarship bodies.",
    },
    {
      title: "Essay Writing",
      description: "You will draft your essays and personal statements. We provide guidance and resources to help you craft compelling stories.",
    },
    {
      title: "Essay Editing and Proofreading",
      description: "Our team of experts will edit and proofread your essays to enhance clarity, impact, and grammatical correctness.",
    },
    {
      title: "Resume/CV Proofreading and Editing",
      description: "Upon request, we will proofread and edit your resume or CV to ensure it is professional and tailored to your applications.",
    },
    {
      title: "Document Finalization",
      description: "We will finalize all your documents, ensuring they are ready for submission.",
    },
    {
      title: "Application Submission",
      description: "The final step is to submit your applications. We will guide you through the submission process to ensure it's done correctly and on time.",
    },
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-20">
      <section id="services" className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-4 text-gray-800">
          Our Admissions and Scholarship Applications Consulting Services
        </h2>
        <p className="text-center text-gray-600 mb-12">
          Our comprehensive roadmap to help you succeed in your applications.
        </p>
        <div className="relative">
          <div className="hidden md:block absolute border-l-4 border-blue-500 h-full left-1/2 transform -translate-x-1/2"></div>
          {roadmapSteps.map((step, index) => (
            <div
              key={index}
              className={`mb-8 flex justify-center items-center w-full ${
                index % 2 === 0 ? "md:flex-row-reverse" : ""
              }`}
            >
              <div className="hidden md:block w-1/2"></div>
              <div className="hidden md:block relative">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="w-full md:w-1/2 md:pl-8 pr-4">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ProgramsNservices;
