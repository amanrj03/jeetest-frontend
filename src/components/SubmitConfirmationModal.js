import React from 'react';
import Modal from './Modal';

const SubmitConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  attempt, 
  answers, 
  submitting 
}) => {
  if (!attempt || !attempt.test) return null;

  const getSectionStats = (section) => {
    const stats = {
      total: section.questions.length,
      answered: 0,
      notAnswered: 0,
      markedForReview: 0,
      notVisited: 0
    };

    section.questions.forEach(question => {
      const answer = answers[question.id];
      const status = answer?.status || 'NOT_VISITED';
      
      // Check if question has an actual answer (regardless of status)
      const hasAnswer = answer?.selectedOption || 
                       (answer?.integerAnswer !== null && answer?.integerAnswer !== undefined);
      
      switch (status) {
        case 'ANSWERED':
          stats.answered++;
          break;
        case 'NOT_ANSWERED':
          stats.notAnswered++;
          break;
        case 'MARKED_FOR_REVIEW':
          stats.markedForReview++;
          // If marked for review AND has an answer, also count as answered
          if (hasAnswer) {
            stats.answered++;
          }
          break;
        default:
          stats.notVisited++;
      }
    });

    return stats;
  };

  const getOverallStats = () => {
    const overall = {
      total: 0,
      answered: 0,
      notAnswered: 0,
      markedForReview: 0,
      notVisited: 0
    };

    attempt.test.sections.forEach(section => {
      const sectionStats = getSectionStats(section);
      overall.total += sectionStats.total;
      overall.answered += sectionStats.answered;
      overall.notAnswered += sectionStats.notAnswered;
      overall.markedForReview += sectionStats.markedForReview;
      overall.notVisited += sectionStats.notVisited;
    });

    return overall;
  };

  const overallStats = getOverallStats();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Submit Test Confirmation"
      showCloseButton={false}
    >
      <div className="flex flex-col h-96"> {/* Fixed height container */}
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 submit-modal-scroll">
          <div className="space-y-6">
            {/* Warning Message */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="text-yellow-600 mr-3">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-yellow-800">
                    Are you sure you want to submit the test?
                  </h3>
                  <p className="text-yellow-700 mt-1">
                    This action cannot be undone. Please review your answers before submitting.
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Overall Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{overallStats.total}</div>
                  <div className="text-sm text-gray-600">Total Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{overallStats.answered}</div>
                  <div className="text-sm text-gray-600">Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{overallStats.notAnswered}</div>
                  <div className="text-sm text-gray-600">Not Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{overallStats.markedForReview}</div>
                  <div className="text-sm text-gray-600">Marked for Review</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{overallStats.notVisited}</div>
                  <div className="text-sm text-gray-600">Not Visited</div>
                </div>
              </div>
            </div>

            {/* Section-wise Statistics */}
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Section-wise Summary</h3>
              <div className="space-y-3">
                {attempt.test.sections.map((section, index) => {
                  const stats = getSectionStats(section);
                  return (
                    <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-800 mb-2">{section.name}</h4>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-green-600">{stats.answered}</div>
                          <div className="text-gray-600">Answered</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-orange-600">{stats.notAnswered}</div>
                          <div className="text-gray-600">Not Answered</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-yellow-600">{stats.markedForReview}</div>
                          <div className="text-gray-600">Marked</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-red-600">{stats.notVisited}</div>
                          <div className="text-gray-600">Not Visited</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-md hover:bg-gray-600 font-medium disabled:opacity-50"
          >
            Back to Test
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 font-medium disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SubmitConfirmationModal;