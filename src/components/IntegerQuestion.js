import React, { useState, useEffect } from 'react';

const IntegerQuestion = ({ question, answer, onAnswerChange, questionNumber }) => {
  const [inputValue, setInputValue] = useState(answer?.integerAnswer?.toString() || '');

  // Update inputValue only when question changes (navigation between questions)
  // Don't include answer?.integerAnswer in deps to avoid overwriting user input during sync
  useEffect(() => {
    setInputValue(answer?.integerAnswer?.toString() || '');
  }, [question.id]);

  const handleInputChange = (value) => {
    // Only allow integers (positive, negative, or zero)
    if (value === '' || /^-?\d+$/.test(value)) {
      setInputValue(value);
      
      // Preserve MARKED_FOR_REVIEW status if it exists
      let status;
      if (value === '') {
        status = 'NOT_ANSWERED';
      } else {
        status = answer?.status === 'MARKED_FOR_REVIEW' ? 'MARKED_FOR_REVIEW' : 'ANSWERED';
      }
      
      onAnswerChange({
        integerAnswer: value === '' ? null : parseInt(value),
        status: status
      });
    }
  };

  const handleKeypadClick = (value) => {
    if (value === 'C') {
      setInputValue('');
      onAnswerChange({
        integerAnswer: null,
        status: 'NOT_ANSWERED'
      });
    } else if (value === 'Backspace') {
      const newValue = inputValue.slice(0, -1);
      setInputValue(newValue);
      
      // Preserve MARKED_FOR_REVIEW status if it exists
      let status;
      if (newValue === '') {
        status = 'NOT_ANSWERED';
      } else {
        status = answer?.status === 'MARKED_FOR_REVIEW' ? 'MARKED_FOR_REVIEW' : 'ANSWERED';
      }
      
      onAnswerChange({
        integerAnswer: newValue === '' ? null : parseInt(newValue),
        status: status
      });
    } else {
      const newValue = inputValue + value;
      handleInputChange(newValue);
    }
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

        {/* Integer Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter your answer (Integer only):
          </label>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className="w-full max-w-xs p-3 text-lg border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none text-center"
            placeholder="Enter integer"
            autoComplete="off"
          />
          <div className="text-sm text-gray-500 mt-1">
            Enter a whole number (positive, negative, or zero)
          </div>
        </div>

        {/* Virtual Keypad */}
        <div className="mb-6 flex justify-center">
          <div className="virtual-keypad">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Virtual Keypad</h3>
            <div className="keypad-container">
              {/* Row 1: 1, 2, 3 */}
              <div className="keypad-row">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeypadClick(num.toString())}
                    className="keypad-key"
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              {/* Row 2: 4, 5, 6 */}
              <div className="keypad-row">
                {[4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeypadClick(num.toString())}
                    className="keypad-key"
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              {/* Row 3: 7, 8, 9 */}
              <div className="keypad-row">
                {[7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleKeypadClick(num.toString())}
                    className="keypad-key"
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              {/* Row 4: -, 0, Backspace */}
              <div className="keypad-row">
                <button
                  onClick={() => handleKeypadClick('-')}
                  className="keypad-key keypad-special"
                  title="Negative sign"
                >
                  -
                </button>
                <button
                  onClick={() => handleKeypadClick('0')}
                  className="keypad-key"
                >
                  0
                </button>
                <button
                  onClick={() => handleKeypadClick('Backspace')}
                  className="keypad-key keypad-backspace"
                  title="Backspace"
                >
                  ⌫
                </button>
              </div>
              
              {/* Row 5: Clear (full width) */}
              <div className="keypad-row">
                <button
                  onClick={() => handleKeypadClick('C')}
                  className="keypad-key keypad-clear"
                  title="Clear"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Answer Display */}
        {inputValue && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <span className="text-sm text-blue-700">Current Answer: </span>
            <span className="text-lg font-bold text-blue-800">{inputValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegerQuestion;