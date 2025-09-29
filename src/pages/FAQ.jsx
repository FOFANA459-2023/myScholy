import React, { useState } from "react";

const FAQ = () => {
  const faqData = [
    {
      question: "What documents are required for a scholarship application?",
      answer:
        "Typically, you will need your academic transcripts, a personal statement, letters of recommendation, and proof of identity. Some scholarships may also require a portfolio or proof of extracurricular activities.",
    },
    {
      question: "How do I find scholarships that match my profile?",
      answer:
        "You can use our scholarship matching tool to find opportunities tailored to your academic background, interests, and goals. Simply input your details, and we'll provide a list of suitable scholarships.",
    },
    {
      question: "Can I apply for multiple scholarships at once?",
      answer:
        "Yes, you can apply for multiple scholarships simultaneously. However, make sure to tailor each application to the specific requirements of the scholarship.",
    },
    {
      question: "What is the deadline for most scholarship applications?",
      answer:
        "Deadlines vary depending on the scholarship. Some have rolling deadlines, while others have fixed dates. Always check the specific deadline for each scholarship you're interested in.",
    },
    {
      question: "Do I need to pay to apply for scholarships?",
      answer:
        "No, legitimate scholarships do not require an application fee. Be cautious of any scholarship that asks for payment.",
    },
  ];

  const [activeIndex, setActiveIndex] = useState(null);
  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="bg-gradient-to-br from-sky-400 to-yellow-300 py-16 min-h-screen flex items-center justify-center">
      <div className="max-w-3xl w-full mx-auto px-4">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-8 drop-shadow-lg">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition duration-300 cursor-pointer border border-gray-200"
              onClick={() => toggleFAQ(index)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  {faq.question}
                </h3>
                <span className="text-2xl font-bold text-sky-600">
                  {activeIndex === index ? "−" : "+"}
                </span>
              </div>
              {activeIndex === index && (
                <p className="mt-4 text-gray-600">{faq.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;