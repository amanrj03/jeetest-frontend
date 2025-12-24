import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { testAPI, attemptAPI } from '../services/api';
import Modal from '../components/Modal';

const InstructionPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '', redirectToDashboard: false });
  const candidateName = localStorage.getItem('candidateName');
  const candidateImage = localStorage.getItem('candidateImage');

  useEffect(() => {
    fetchTest();
  }, [testId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTest = async () => {
    try {
      const response = await testAPI.getTestById(testId);
      setTest(response.data);
    } catch (error) {
      console.error('Error fetching test:', error);
      setErrorModal({
        show: true,
        title: 'Test Not Found',
        message: 'Test not found. You will be redirected to the student dashboard.'
      });
      setTimeout(() => navigate('/student'), 3000);
    }
  };

  const startTest = async () => {
    if (!agreed) {
      setErrorModal({
        show: true,
        title: 'Agreement Required',
        message: 'Please read and agree to all instructions before starting the test.'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await attemptAPI.startTest({
        testId,
        candidateName,
        candidateImage
      });

      navigate(`/test/${response.data.id}`);
    } catch (error) {
      console.error('Error starting test:', error);
      
      if (error.response?.status === 403 && error.response?.data?.needsResume) {
        setErrorModal({
          show: true,
          title: 'Resume Permission Required',
          message: 'You previously closed the test window. The test creator needs to approve your request to start the test again. Please contact the test administrator.',
          redirectToDashboard: true
        });
      } else if (error.response?.status === 400) {
        setErrorModal({
          show: true,
          title: 'Cannot Start Test',
          message: error.response.data.error + ' You will be redirected to the student dashboard.'
        });
        setTimeout(() => navigate('/student'), 3000);
      } else {
        setErrorModal({
          show: true,
          title: 'Failed to Start Test',
          message: 'Unable to start the test. Please try again. You will be redirected to the student dashboard.'
        });
        setTimeout(() => navigate('/student'), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading test instructions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/nta-logo.png" 
                alt="NTA Logo" 
                className="h-12"
              />
            </div>
            <div className="flex items-center gap-4">
              {candidateImage && (
                <img 
                  src={candidateImage} 
                  alt="Candidate" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div className="text-right">
                <p className="font-medium">{candidateName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{test.name}</h2>
            <div className="flex justify-center gap-8 text-sm text-gray-600">
              <span>Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m</span>
              <span>Total Marks: {test.totalMarks}</span>
              <span>Questions: {test.sections.reduce((total, section) => total + section.questions.length, 0)}</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-blue-700">General Instructions</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="font-medium mr-2">1.</span>
                    <span>The test will be conducted in fullscreen mode. Do not attempt to exit fullscreen during the test.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">2.</span>
                    <span>You will receive warnings for exiting fullscreen. After 5 warnings, the test will be auto-submitted.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">3.</span>
                    <span>Your answers are automatically saved every 30 seconds. No need to manually save.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">4.</span>
                    <span>You can navigate between questions and sections freely during the test.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-medium mr-2">5.</span>
                    <span>The timer will be displayed at the top right. The test will auto-submit when time expires.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-green-700">Marking Scheme</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-700 text-lg">+4</div>
                    <div className="text-gray-600">Correct Answer</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-700 text-lg">-1</div>
                    <div className="text-gray-600">Wrong Answer</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-gray-700 text-lg">0</div>
                    <div className="text-gray-600">Not Attempted</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-indigo-700">Action Buttons</h3>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-4">
                  During the test, you'll see these action buttons at the bottom of each question:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs font-medium">Previous</button>
                    <div>
                      <div className="font-medium">Previous</div>
                      <div className="text-xs text-gray-600">Go to the previous question</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium">Next</button>
                    <div>
                      <div className="font-medium">Next</div>
                      <div className="text-xs text-gray-600">Go to the next question</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-medium">Mark for Review & Next</button>
                    <div>
                      <div className="font-medium">Mark for Review & Next</div>
                      <div className="text-xs text-gray-600">Mark question for later review and move to next</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="bg-red-500 text-white px-3 py-1 rounded text-xs font-medium">Clear Response</button>
                    <div>
                      <div className="font-medium">Clear Response</div>
                      <div className="text-xs text-gray-600">Remove your answer for this question</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-purple-700">Test Structure</h3>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {test.sections.map((section, index) => (
                    <div key={section.id} className="bg-white p-3 rounded border">
                      <h4 className="font-medium text-gray-800">{section.name}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        <p>Questions: {section.questions.length}</p>
                        <p>Type: {section.questionType}</p>
                        <p>Marks: {section.questions.length * 4}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-orange-700">Question Navigation & Status</h3>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-700 mb-4">
                  During the test, you can see the status of each question in the Question Palette on the right side. Here's what each color means:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 border-2 border-gray-300 text-gray-700 rounded flex items-center justify-center text-sm font-medium">1</div>
                    <div>
                      <div className="font-medium">Not Visited</div>
                      <div className="text-xs text-gray-600">Questions you haven't opened yet</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 border-2 border-red-300 text-red-700 rounded flex items-center justify-center text-sm font-medium">2</div>
                    <div>
                      <div className="font-medium">Not Answered</div>
                      <div className="text-xs text-gray-600">Questions you visited but didn't answer</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 border-2 border-green-500 text-green-700 rounded flex items-center justify-center text-sm font-medium">3</div>
                    <div>
                      <div className="font-medium">Answered</div>
                      <div className="text-xs text-gray-600">Questions you have answered</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-500 text-yellow-700 rounded flex items-center justify-center text-sm font-medium">4</div>
                    <div>
                      <div className="font-medium">Marked for Review</div>
                      <div className="text-xs text-gray-600">Questions marked for later review</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border-2 border-green-500 text-black font-bold rounded flex items-center justify-center text-sm" style={{background: 'linear-gradient(135deg, #dcfce7 50%, #fef3c7 50%)'}}>5</div>
                    <div>
                      <div className="font-medium">Answered & Marked</div>
                      <div className="text-xs text-gray-600">Questions both answered and marked for review</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 border-2 border-blue-500 text-blue-700 rounded flex items-center justify-center text-sm font-medium ring-2 ring-blue-500">6</div>
                    <div>
                      <div className="font-medium">Current Question</div>
                      <div className="text-xs text-gray-600">The question you're currently viewing</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-white rounded border-l-4 border-orange-500">
                  <p className="text-sm text-gray-700">
                    <strong>Tip:</strong> Use the "Mark for Review & Next" button to quickly mark questions you want to revisit later. 
                    You can click on any question number in the palette to jump directly to that question.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-red-700">Important Warnings</h3>
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span>Do not close the browser or navigate away from the test page.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span>Do not use browser back/forward buttons during the test.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span>Ensure stable internet connection throughout the test duration.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span>Any attempt to cheat or use unfair means will result in disqualification.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                I have read and understood all the instructions mentioned above. I agree to follow all the guidelines and understand that any violation may result in disqualification.
              </span>
            </label>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate('/student')}
              className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium"
            >
              Back to Dashboard
            </button>
            <button
              onClick={startTest}
              disabled={!agreed || loading}
              className="px-8 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Starting Test...' : 'Start Test'}
            </button>
          </div>
        </div>
      </div>

      {/* Error Modal */}
      <Modal
        isOpen={errorModal.show}
        onClose={() => {
          if (errorModal.redirectToDashboard) {
            navigate('/student');
          } else {
            setErrorModal({ show: false, title: '', message: '', redirectToDashboard: false });
          }
        }}
        title={errorModal.title}
        showCloseButton={!loading}
      >
        <div className="text-center">
          <p className="text-gray-700 mb-4">{errorModal.message}</p>
          {!loading && (
            <button
              onClick={() => {
                if (errorModal.redirectToDashboard) {
                  navigate('/student');
                } else {
                  setErrorModal({ show: false, title: '', message: '', redirectToDashboard: false });
                }
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              OK
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default InstructionPage;