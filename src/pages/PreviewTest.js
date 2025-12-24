import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { testAPI } from '../services/api';

const PreviewTest = () => {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTest();
  }, [testId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTest = async () => {
    try {
      const response = await testAPI.getTestById(testId);
      setTest(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching test:', error);
      setLoading(false);
    }
  };

  const getCurrentQuestion = () => {
    if (!test || !test.sections || !test.sections[currentSection]) return null;
    const section = test.sections[currentSection];
    if (!section.questions || !section.questions[currentQuestion]) return null;
    return section.questions[currentQuestion];
  };

  const navigateToQuestion = (sectionIndex, questionIndex) => {
    setCurrentSection(sectionIndex);
    setCurrentQuestion(questionIndex);
  };

  const nextQuestion = () => {
    const currentSectionObj = test.sections[currentSection];
    if (currentQuestion < currentSectionObj.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else if (currentSection < test.sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentQuestion(0);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentQuestion(test.sections[currentSection - 1].questions.length - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading test preview...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Test not found</p>
          <button
            onClick={() => window.close()}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const currentQ = getCurrentQuestion();
  const currentSectionObj = test?.sections?.[currentSection];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-900 text-white px-6 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="/nta-logo.png" 
              alt="NTA Logo" 
              className="h-10"
            />
            <div>
              <h1 className="text-xl font-bold">Test Preview: {test.name}</h1>
              <p className="text-sm opacity-90">
                Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m | 
                Total Marks: {test.totalMarks}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-yellow-300">PREVIEW MODE</div>
            <div className="text-sm">Correct answers are shown</div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="bg-gray-100 px-6 py-2 border-b">
        <div className="flex gap-2">
          {test?.sections?.map((section, index) => (
            <button
              key={section.id}
              onClick={() => navigateToQuestion(index, 0)}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                currentSection === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {section.name} ({section.questions.length})
            </button>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {currentQ && (
            <div className="max-w-4xl">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Question {currentQuestion + 1} of {currentSectionObj.questions.length}
                  </h2>
                  <div className="text-sm text-gray-600">
                    {currentSectionObj.name} - {currentSectionObj.questionType}
                  </div>
                </div>
                
                {/* Question Image */}
                {currentQ.questionImage ? (
                  <div className="mb-6">
                    <img
                      src={currentQ.questionImage}
                      alt={`Question ${currentQuestion + 1}`}
                      className="max-w-full h-auto border border-gray-300 rounded"
                      onError={(e) => {
                        console.error('Failed to load image:', e.target.src);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="text-red-500 text-sm mt-2" style={{ display: 'none' }}>
                      Failed to load question image: {currentQ.questionImage}
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 p-4 bg-gray-100 rounded text-center text-gray-500">
                    Question image not available
                  </div>
                )}

                {/* Answer Section */}
                {currentSectionObj.questionType === 'MCQ' ? (
                  <div className="space-y-3 mb-6">
                    {['A', 'B', 'C', 'D'].map((option) => (
                      <div
                        key={option}
                        className={`flex items-center p-4 border-2 rounded-lg ${
                          currentQ.correctOption === option
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          currentQ.correctOption === option
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300'
                        }`}>
                          {currentQ.correctOption === option && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <span className="text-lg font-medium mr-4">{option}</span>
                        <span className="text-gray-600">Option {option}</span>
                        {currentQ.correctOption === option && (
                          <span className="ml-auto text-green-600 font-bold">✓ Correct Answer</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-6">
                    <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                      <div className="text-sm text-green-700 mb-2">Correct Answer:</div>
                      <div className="text-2xl font-bold text-green-800">
                        {currentQ.correctInteger}
                      </div>
                    </div>
                  </div>
                )}

                {/* Solution Image */}
                {currentQ.solutionImage && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Solution:</h3>
                    <img
                      src={currentQ.solutionImage}
                      alt={`Solution ${currentQuestion + 1}`}
                      className="max-w-full h-auto border border-gray-300 rounded"
                      onError={(e) => {
                        console.error('Failed to load solution image:', e.target.src);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                    <div className="text-red-500 text-sm mt-2" style={{ display: 'none' }}>
                      Failed to load solution image: {currentQ.solutionImage}
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center">
                <button
                  onClick={prevQuestion}
                  disabled={currentSection === 0 && currentQuestion === 0}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="text-sm text-gray-600">
                  Question {currentQuestion + 1} of {currentSectionObj.questions.length} in {currentSectionObj.name}
                </div>
                
                <button
                  onClick={nextQuestion}
                  disabled={
                    currentSection === test.sections.length - 1 && 
                    currentQuestion === currentSectionObj.questions.length - 1
                  }
                  className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Question Palette */}
        <div className="w-80 bg-gray-50 border-l p-4">
          <h3 className="text-lg font-semibold mb-4">Question Navigation</h3>
          
          {/* Current Section Questions */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3">
              {currentSectionObj.name} - Questions
            </h4>
            
            <div className="grid grid-cols-5 gap-2">
              {currentSectionObj.questions.map((question, questionIndex) => (
                <button
                  key={question.id}
                  onClick={() => navigateToQuestion(currentSection, questionIndex)}
                  className={`w-8 h-8 flex items-center justify-center text-sm font-medium border-2 cursor-pointer transition-colors rounded ${
                    currentQuestion === questionIndex
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {questionIndex + 1}
                </button>
              ))}
            </div>
          </div>

          {/* All Sections Overview */}
          <div>
            <h4 className="text-sm font-medium mb-3">All Sections</h4>
            {test?.sections?.map((section, sectionIndex) => (
              <div key={section.id} className="mb-4">
                <h5 className="text-xs font-medium text-gray-600 mb-2">
                  {section.name} ({section.questions.length} questions)
                </h5>
                <div className="grid grid-cols-10 gap-1">
                  {section.questions.map((question, questionIndex) => (
                    <button
                      key={question.id}
                      onClick={() => navigateToQuestion(sectionIndex, questionIndex)}
                      className={`w-6 h-6 text-xs flex items-center justify-center border cursor-pointer transition-colors rounded ${
                        currentSection === sectionIndex && currentQuestion === questionIndex
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                      title={`${section.name} - Question ${questionIndex + 1}`}
                    >
                      {questionIndex + 1}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Test Summary */}
          <div className="mt-6 p-3 bg-blue-50 rounded text-sm">
            <h4 className="font-medium mb-2">Test Summary</h4>
            <div className="space-y-1">
              <div>Total Questions: {test.sections.reduce((sum, section) => sum + section.questions.length, 0)}</div>
              <div>Total Marks: {test.totalMarks}</div>
              <div>Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m</div>
              <div>Sections: {test.sections.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewTest;