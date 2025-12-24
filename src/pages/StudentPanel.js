import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { testAPI, attemptAPI } from '../services/api';
import Modal from '../components/Modal';

const StudentPanel = () => {
  const [candidateName] = useState('Ansh Ranjan');
  const [candidateImage] = useState('/ANSHPHOTO.jpg');
  const [liveTests, setLiveTests] = useState([]);
  const [attemptedTests, setAttemptedTests] = useState([]);
  const [modal, setModal] = useState({ show: false, title: '', message: '' });

  const navigate = useNavigate();

  // Calculate accuracy based on attempted questions vs correct questions
  const calculateAccuracy = (attempt) => {
    if (!attempt.answers || attempt.answers.length === 0) {
      return '0.0';
    }

    let correctCount = 0;
    let attemptedCount = 0;

    attempt.answers.forEach(answer => {
      if (answer.isCorrect !== null) {
        attemptedCount++;
        if (answer.isCorrect === true) {
          correctCount++;
        }
      }
    });

    if (attemptedCount === 0) {
      return '0.0';
    }

    return ((correctCount / attemptedCount) * 100).toFixed(1);
  };

  useEffect(() => {
    // Auto-load tests on mount
    localStorage.setItem('candidateName', candidateName);
    localStorage.setItem('candidateImage', candidateImage);
    fetchLiveTests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLiveTests = async () => {
    try {
      const [liveResponse, attemptedResponse] = await Promise.all([
        testAPI.getLiveTests(),
        attemptAPI.getUserAttempts(candidateName)
      ]);
      
      const allLiveTests = liveResponse.data;
      const userAttempts = attemptedResponse.data;
      
      // Get IDs of tests the user has already COMPLETED
      const completedTestIds = userAttempts
        .filter(attempt => attempt.isCompleted)
        .map(attempt => attempt.testId);
      
      // Filter out tests that user has already COMPLETED
      const availableLiveTests = allLiveTests.filter(test => 
        !completedTestIds.includes(test.id)
      );
      
      setLiveTests(availableLiveTests);
      setAttemptedTests(userAttempts);
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };



  // Removed handleNameSubmit and handleImageUpload - using predefined student details

  const startTest = async (testId) => {
    if (!candidateName.trim()) {
      setModal({
        show: true,
        title: 'Name Required',
        message: 'Please enter your name first'
      });
      return;
    }

    // Just navigate to instructions - the actual test start will happen there
    navigate(`/instructions/${testId}`);
  };



  const analyseTest = (attemptId) => {
    window.open(`/analyse/${attemptId}`, '_blank');
  };

  // Removed name entry form - directly show dashboard

  return (
    <>
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
            </div>
            <div className="flex items-center gap-4">
              <img 
                src={candidateImage} 
                alt="Candidate" 
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = '/api/placeholder/40/40'; // Fallback image
                }}
              />
              <div className="text-right">
                <p className="font-medium">{candidateName}</p>
                <p className="text-sm text-gray-500">Student</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Tests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6 text-green-700">Live Tests</h2>
            
            {liveTests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No live tests available</p>
                <div className="text-sm text-gray-400">
                  Live tests will appear here when they are activated by administrators
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {liveTests.map(test => (
                  <div key={test.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{test.name}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m</p>
                          <p>Total Marks: {test.totalMarks}</p>
                          <p>Sections: {test.sections.length}</p>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        LIVE
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Total Questions: {test.sections.reduce((total, section) => total + section.questions.length, 0)}
                      </div>
                      <button
                        onClick={() => startTest(test.id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-medium"
                      >
                        Start Test
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attempted Tests */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6 text-blue-700">Attempted Tests</h2>
            
            {attemptedTests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No attempted tests</p>
                <div className="text-sm text-gray-400">
                  Your completed tests will appear here for analysis
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {attemptedTests.map(attempt => (
                  <div key={attempt.id} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{attempt.test.name}</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Test Date: {new Date(attempt.endTime).toLocaleDateString()}</p>
                          <p>Duration: {Math.floor(attempt.test.duration / 60)}h {attempt.test.duration % 60}m</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-700">
                          {attempt.totalMarks}/{attempt.test.totalMarks}
                        </div>
                        <div className="text-sm text-gray-600">
                          Accuracy: {calculateAccuracy(attempt)}%
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        Completed on {new Date(attempt.endTime).toLocaleString()}
                      </div>
                      <button
                        onClick={() => analyseTest(attempt.id)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium"
                      >
                        Analyse
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Important Instructions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
            <div>
              <h4 className="font-medium mb-2">Before Starting Test:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Ensure stable internet connection</li>
                <li>Close all other applications</li>
                <li>Keep your admit card ready</li>
                <li>Use Chrome or Firefox browser</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">During Test:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Do not exit fullscreen mode</li>
                <li>Do not refresh the page</li>
                <li>Answers are auto-saved every 30 seconds</li>
                <li>Test will auto-submit after 5 warnings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Modal */}
    <Modal
      isOpen={modal.show}
      onClose={() => setModal({ show: false, title: '', message: '' })}
      title={modal.title}
    >
      <div className="text-center">
        <p className="text-gray-700 mb-4">{modal.message}</p>
        <button
          onClick={() => setModal({ show: false, title: '', message: '' })}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          OK
        </button>
      </div>
    </Modal>
    </>
  );
};

export default StudentPanel;