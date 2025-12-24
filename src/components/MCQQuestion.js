import React from 'react';

const MCQQuestion = ({ question, answer, onAnswerChange, questionNumber }) => {
  const handleOptionSelect = (option) => {
    // Preserve MARKED_FOR_REVIEW status if it exists, otherwise set to ANSWERED
    const status = answer?.status === 'MARKED_FOR_REVIEW' ? 'MARKED_FOR_REVIEW' : 'ANSWERED';
    
    onAnswerChange({
      selectedOption: option,
      status: status
    });
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Question {questionNumber}
        </h2>
        
        {/* Question Image */}
        {question.questionImage ? (
          <div className="mb-6">
            <img
              src={question.questionImage}
              alt={`Question ${questionNumber}`}
              className="max-w-full h-auto border border-gray-300 rounded"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <div className="text-red-500 text-sm mt-2" style={{ display: 'none' }}>
              Failed to load question image
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-100 rounded text-center text-gray-500">
            Question image not available
          </div>
        )}

        {/* Options - Vertical Compact Design */}
        <div className="space-y-2 max-w-xs">
          {['A', 'B', 'C', 'D'].map((option) => (
            <label
              key={option}
              className={`flex items-center p-2 border-2 rounded-lg cursor-pointer transition-colors text-sm ${
                answer?.selectedOption === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={answer?.selectedOption === option}
                onChange={() => handleOptionSelect(option)}
                className="w-3 h-3 text-blue-600 border-gray-300 focus:ring-blue-500 mr-2"
              />
              <span className="font-medium">
                Option {option}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MCQQuestion;