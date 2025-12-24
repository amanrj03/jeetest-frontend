import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { attemptAPI } from '../services/api';
import { getJeeMainsStats } from '../data/jeeMainsStats';

const AnalysePage = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [selectedSection, setSelectedSection] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAttempt = async () => {
    try {
      const response = await attemptAPI.getAttempt(attemptId);
      setAttempt(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attempt:', error);
      setLoading(false);
    }
  };

  const getAnswerForQuestion = (questionId) => {
    return attempt.answers.find(answer => answer.questionId === questionId);
  };

  const getSectionStats = (sectionQuestions) => {
    const stats = {
      total: sectionQuestions.length,
      correct: 0,
      wrong: 0,
      unattempted: 0,
      marks: 0
    };

    sectionQuestions.forEach(question => {
      const answer = getAnswerForQuestion(question.id);
      if (answer && answer.isCorrect !== null) {
        if (answer.isCorrect === true) {
          stats.correct++;
          stats.marks += answer.marksAwarded;
        } else if (answer.isCorrect === false) {
          stats.wrong++;
          stats.marks += answer.marksAwarded; // This will be negative
        }
      } else {
        // No answer found or isCorrect is null (unattempted)
        stats.unattempted++;
      }
    });

    // Calculate section accuracy based on attempted questions vs correct questions
    const attemptedQuestions = stats.correct + stats.wrong;
    stats.accuracy = attemptedQuestions > 0 ? ((stats.correct / attemptedQuestions) * 100).toFixed(2) : '0.00';

    return stats;
  };

  const getOverallStats = () => {
    if (!attempt) return null;

    const stats = {
      total: 0,
      correct: 0,
      wrong: 0,
      unattempted: 0,
      totalMarks: attempt.totalMarks,
      maxMarks: attempt.test.totalMarks,
      percentage: ((attempt.totalMarks / attempt.test.totalMarks) * 100).toFixed(2)
    };

    attempt.test.sections.forEach(section => {
      const sectionStats = getSectionStats(section.questions);
      stats.total += sectionStats.total;
      stats.correct += sectionStats.correct;
      stats.wrong += sectionStats.wrong;
      stats.unattempted += sectionStats.unattempted;
    });

    // Calculate accuracy based on attempted questions vs correct questions
    const attemptedQuestions = stats.correct + stats.wrong;
    const accuracy = attemptedQuestions > 0 ? ((stats.correct / attemptedQuestions) * 100).toFixed(2) : '0.00';
    stats.accuracy = accuracy;

    return stats;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load test analysis</p>
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

  const overallStats = getOverallStats();
  const currentSection = attempt.test.sections[selectedSection];
  const sectionStats = getSectionStats(currentSection.questions);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/nta-logo.png" 
                alt="NTA Logo" 
                className="h-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{attempt.test.name} - Analysis</h1>
                <p className="text-gray-600">Candidate: {attempt.candidateName}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {overallStats.totalMarks}/{overallStats.maxMarks}
              </div>
              <div className="text-sm text-gray-600">
                {overallStats.percentage}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Overall Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{overallStats.total}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{overallStats.correct}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{overallStats.wrong}</div>
              <div className="text-sm text-gray-600">Wrong</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{overallStats.unattempted}</div>
              <div className="text-sm text-gray-600">Unattempted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallStats.accuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </div>

        {/* JEE Mains Expected Statistics */}
        {(() => {
          const jeeStats = getJeeMainsStats(overallStats.totalMarks);
          return jeeStats ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-8 border border-blue-200">
              <h2 className="text-xl font-semibold mb-4 text-blue-800">
                🎯 JEE Mains Expected Performance
              </h2>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {overallStats.totalMarks}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Your Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-2">
                      {jeeStats.percentileRange}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Expected Percentile</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Based on JEE Mains data
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {jeeStats.rankRange}
                    </div>
                    <div className="text-sm text-gray-600 font-medium">Expected Rank Range</div>
                    <div className="text-xs text-gray-500 mt-1">
                      All India Rank (AIR)
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> These are estimated values based on previous JEE Mains data. 
                    Actual percentile and rank may vary depending on the difficulty level and performance of all candidates.
                  </p>
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* Section Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Section Analysis</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {attempt.test.sections.map((section, index) => {
              const stats = getSectionStats(section.questions);
              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(index)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSection === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {section.name}
                  <span className="ml-2 text-sm">
                    ({stats.correct}/{stats.total})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Current Section Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-lg font-bold text-gray-800">{sectionStats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">{sectionStats.correct}</div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">{sectionStats.wrong}</div>
              <div className="text-sm text-gray-600">Wrong</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">{sectionStats.marks}</div>
              <div className="text-sm text-gray-600">Marks</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-lg font-bold text-purple-600">{sectionStats.accuracy}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </div>

        {/* Questions Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            {currentSection.name} - Question Analysis
          </h3>
          
          <div className="space-y-6">
            {currentSection.questions.map((question, index) => {
              const answer = getAnswerForQuestion(question.id);
              const isCorrect = answer?.isCorrect;
              const marksAwarded = answer?.marksAwarded || 0;

              
              return (
                <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-md font-medium">
                      Question {index + 1}
                    </h4>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        isCorrect === true ? 'bg-green-100 text-green-800' :
                        isCorrect === false ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {isCorrect === true ? 'Correct' :
                         isCorrect === false ? 'Wrong' :
                         'Unattempted'}
                      </span>
                      <span className={`font-bold ${
                        marksAwarded > 0 ? 'text-green-600' :
                        marksAwarded < 0 ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {marksAwarded > 0 ? '+' : ''}{marksAwarded}
                      </span>
                    </div>
                  </div>

                  {/* Question Image */}
                  {question.questionImage && (
                    <div className="mb-4">
                      <img
                        src={question.questionImage}
                        alt={`Question ${index + 1}`}
                        className="max-w-full h-auto border border-gray-300 rounded"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Your Answer:</h5>
                      {currentSection.questionType === 'MCQ' ? (
                        <div className="text-lg">
                          {answer?.selectedOption ? (
                            <span className={`font-bold ${
                              isCorrect === true ? 'text-green-600' :
                              isCorrect === false ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              Option {answer.selectedOption}
                            </span>
                          ) : (
                            <span className="text-gray-500">Not attempted</span>
                          )}
                        </div>
                      ) : (
                        <div className="text-lg">
                          {(answer?.integerAnswer !== null && answer?.integerAnswer !== undefined) ? (
                            <span className={`font-bold ${
                              isCorrect === true ? 'text-green-600' :
                              isCorrect === false ? 'text-red-600' :
                              'text-gray-600'
                            }`}>
                              {answer.integerAnswer}
                            </span>
                          ) : (
                            <span className="text-gray-500">Not attempted</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Correct Answer:</h5>
                      <div className="text-lg">
                        {currentSection.questionType === 'MCQ' ? (
                          <span className="font-bold text-green-600">
                            Option {question.correctOption}
                          </span>
                        ) : (
                          <span className="font-bold text-green-600">
                            {question.correctInteger}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Solution Image */}
                  {question.solutionImage && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">Solution:</h5>
                      <img
                        src={question.solutionImage}
                        alt={`Solution ${index + 1}`}
                        className="max-w-full h-auto border border-gray-300 rounded"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysePage;