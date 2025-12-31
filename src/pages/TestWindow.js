import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attemptAPI } from '../services/api';
import { useFullscreen } from '../hooks/useFullscreen';
import { useTimer } from '../hooks/useTimer';
import { useTimeTracking } from '../hooks/useTimeTracking';
import { keepAliveService } from '../services/keepAlive';
import QuestionPalette from '../components/QuestionPalette';
import MCQQuestion from '../components/MCQQuestion';
import IntegerQuestion from '../components/IntegerQuestion';
import SubmitConfirmationModal from '../components/SubmitConfirmationModal';
import Modal from '../components/Modal';
import WarningModal from '../components/WarningModal';

const TestWindow = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  

  const [errorModal, setErrorModal] = useState({ show: false, title: '', message: '' });
  const syncIntervalRef = useRef(null);

  const candidateName = localStorage.getItem('candidateName');
  const candidateImage = localStorage.getItem('candidateImage');

  // Initialize time tracking
  const {
    startQuestionTimer,
    stopCurrentTimer,
    syncTimeData
  } = useTimeTracking(attemptId);

  console.log('🔧 TestWindow initialized with attemptId:', attemptId);

  const handleConfirmSubmit = useCallback(async (skipConfirmation = false) => {
    if (submitting) return;
    
    console.log('handleConfirmSubmit called, skipConfirmation:', skipConfirmation);
    setSubmitting(true);
    
    try {
      // Stop current timer and sync final time data
      stopCurrentTimer();
      await syncTimeData();
      
      // Clear sync interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      // Prepare answers for submission
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        selectedOption: answer.selectedOption || null,
        integerAnswer: answer.integerAnswer || null,
        status: answer.status || 'NOT_VISITED'
      }));

      await attemptAPI.submitTest({
        attemptId,
        answers: answersArray
      });

      setShowSubmitModal(false);
      
      if (skipConfirmation) {
        // For auto-submission, redirect immediately
        navigate('/student');
      } else {
        setErrorModal({
          show: true,
          title: 'Test Submitted Successfully!',
          message: 'Your test has been submitted successfully. You will be redirected to the student dashboard.'
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/student');
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error submitting test:', error);
      setShowSubmitModal(false);
      setErrorModal({
        show: true,
        title: 'Submission Failed',
        message: 'Failed to submit test. Please try again.'
      });
      setSubmitting(false);
    }
  }, [submitting, answers, attemptId, navigate, stopCurrentTimer, syncTimeData]);

  const handleSubmitTest = useCallback((skipConfirmation = false) => {
    if (submitting) return;
    
    if (skipConfirmation) {
      // For auto-submission, skip confirmation modal
      handleConfirmSubmit(true);
    } else {
      // For manual submission, show confirmation modal
      setShowSubmitModal(true);
    }
  }, [submitting, handleConfirmSubmit]);

  // Handle fullscreen warnings
  const handleWarning = useCallback(async (warningCount) => {
    try {
      await attemptAPI.updateWarning({ attemptId });
    } catch (error) {
      console.error('Error updating warning:', error);
    }
  }, [attemptId]);

  // Handle direct auto-submission due to violations (bypasses all modals)
  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    
    console.log('🚀 AUTO-SUBMITTING TEST');
    setSubmitting(true);
    
    try {
      // Clear sync interval
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }

      // Prepare answers for submission
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        selectedOption: answer.selectedOption || null,
        integerAnswer: answer.integerAnswer || null,
        status: answer.status || 'NOT_VISITED'
      }));

      await attemptAPI.submitTest({
        attemptId,
        answers: answersArray
      });

      // Close time up modal if it's open
      setShowTimeUpModal(false);

      // For auto-submission, redirect immediately without any modals
      navigate('/student');
      
    } catch (error) {
      console.error('Error auto-submitting test:', error);
      // Even on error, redirect to avoid getting stuck
      navigate('/student');
    }
  }, [submitting, answers, attemptId, navigate]);

  const showModal = (modalData) => {
    setErrorModal({
      show: true,
      title: modalData.title,
      message: modalData.message
    });
  };

  const { 
    enterFullscreen, 
    showWarningModal, 
    handleWarningOk, 
    handleWarningTimeout 
  } = useFullscreen(handleWarning, showModal, handleAutoSubmit);

  // Handle timer - show modal when time is up, then auto-submit
  const handleTimeUp = useCallback(() => {
    console.log('⏰ TIME UP! Showing time up modal');
    setShowTimeUpModal(true);
    
    // Auto-submit after showing the modal
    setTimeout(async () => {
      console.log('⏰ Auto-submitting test due to timer expiry');
      
      if (submitting) return;
      setSubmitting(true);
      
      try {
        // Clear sync interval
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }

        // Prepare answers for submission
        const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          selectedOption: answer.selectedOption || null,
          integerAnswer: answer.integerAnswer || null,
          status: answer.status || 'NOT_VISITED'
        }));

        await attemptAPI.submitTest({
          attemptId,
          answers: answersArray
        });

        // Close time up modal
        setShowTimeUpModal(false);

        // Redirect to student dashboard
        navigate('/student');
        
      } catch (error) {
        console.error('Error auto-submitting test:', error);
        // Even on error, redirect to avoid getting stuck
        navigate('/student');
      }
    }, 1000); // Give 1 second to show the modal
  }, [submitting, answers, attemptId, navigate]);

  const { formattedTime, start: startTimer, reset: resetTimer } = useTimer(0, handleTimeUp);



  useEffect(() => {
    fetchAttempt();
    enterFullscreen();
    
    // Start keep-alive service when test window opens
    keepAliveService.start('TestWindow');
    
    // Add beforeunload handler to request resume permission
    const handleBeforeUnload = () => {
      // Request resume permission when user tries to close/refresh
      if (attemptId && !submitting) {
        try {
          // Use sendBeacon for reliable sync during page unload
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
          const blob = new Blob([JSON.stringify({ attemptId })], { type: 'application/json' });
          navigator.sendBeacon(`${apiUrl}/attempts/request-resume`, blob);
        } catch (error) {
          console.error('Error sending resume request:', error);
        }
      }
      
      // No browser warning - let them close the tab freely
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Stop keep-alive service when test window closes
      keepAliveService.stop('TestWindow');
    };
  }, [attemptId, enterFullscreen]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAttempt = async () => {
    try {
      const response = await attemptAPI.getAttempt(attemptId);
      const attemptData = response.data;
      
      setAttempt(attemptData);
      
      // Initialize answers from existing attempt
      const initialAnswers = {};
      attemptData.answers.forEach(answer => {
        initialAnswers[answer.questionId] = {
          selectedOption: answer.selectedOption,
          integerAnswer: answer.integerAnswer,
          status: answer.status
        };
      });
      setAnswers(initialAnswers);
      
      // Mark the initial question (first question) as visited
      const firstQuestion = attemptData.test.sections[0]?.questions[0];
      if (firstQuestion && (!initialAnswers[firstQuestion.id] || initialAnswers[firstQuestion.id].status === 'NOT_VISITED')) {
        setTimeout(() => {
          updateAnswer(firstQuestion.id, { status: 'NOT_ANSWERED' });
        }, 100); // Small delay to ensure state is set
      }
      
      // Always start with full test duration
      const testDuration = attemptData.test.duration * 60; // in seconds
      const timerValue = Math.max(testDuration, 10);
      resetTimer(timerValue);
      
      setLoading(false);
      
      // Start timer after a short delay to ensure everything is loaded
      setTimeout(() => {
        startTimer();
        
        // Start time tracking for the first question
        if (firstQuestion) {
          startQuestionTimer(firstQuestion.id);
        }
      }, 1000);
      
      // Start auto-sync
      startAutoSync();
      
    } catch (error) {
      console.error('Error fetching attempt:', error);
      setErrorModal({
        show: true,
        title: 'Failed to Load Test',
        message: 'Unable to load the test. You will be redirected to the student dashboard.'
      });
      setTimeout(() => {
        navigate('/student');
      }, 3000);
    }
  };

  const startAutoSync = () => {
    syncIntervalRef.current = setInterval(() => {
      syncAnswers();
    }, 15000); // Reduced to 15 seconds for better resume reliability
  };

  const syncAnswers = async () => {
    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        ...answer
      }));

      await attemptAPI.syncAnswers({
        attemptId,
        answers: answersArray
      });
    } catch (error) {
      console.error('Error syncing answers:', error);
    }
  };

  const updateAnswer = (questionId, answerData) => {
    setAnswers(prev => {
      const currentAnswer = prev[questionId] || {};
      const newAnswer = { ...currentAnswer, ...answerData };
      
      // Only auto-detect status if it's not explicitly provided
      if (!answerData.status) {
        // For MCQ questions, check if selectedOption is provided
        const hasMCQAnswer = newAnswer.selectedOption !== null && newAnswer.selectedOption !== undefined;
        
        // For integer questions, check if integerAnswer is provided (including 0)
        const hasIntegerAnswer = newAnswer.integerAnswer !== null && newAnswer.integerAnswer !== undefined;
        
        const hasAnswer = hasMCQAnswer || hasIntegerAnswer;
        
        if (hasAnswer) {
          newAnswer.status = 'ANSWERED';
        } else {
          newAnswer.status = 'NOT_ANSWERED';
        }
      }
      // If status is explicitly provided (like from MCQQuestion), use it as-is
      
      return {
        ...prev,
        [questionId]: newAnswer
      };
    });
  };

  const getCurrentQuestion = () => {
    if (!attempt || !attempt.test || !attempt.test.sections || !attempt.test.sections[currentSection]) return null;
    const section = attempt.test.sections[currentSection];
    if (!section.questions || !section.questions[currentQuestion]) return null;
    return section.questions[currentQuestion];
  };

  const getAllQuestions = () => {
    if (!attempt || !attempt.test || !attempt.test.sections) return [];
    return attempt.test.sections.flatMap(section => section.questions || []);
  };

  const getQuestionStatus = (questionId) => {
    return answers[questionId]?.status || 'NOT_VISITED';
  };

  const navigateToQuestion = (sectionIndex, questionIndex) => {
    // Get current and new question IDs
    const currentQ = getCurrentQuestion();
    const newQuestionId = attempt.test.sections[sectionIndex]?.questions[questionIndex]?.id;
    
    console.log('🧭 Navigating from question:', currentQ?.id, 'to question:', newQuestionId);
    
    // Stop timer for current question FIRST
    if (currentQ) {
      console.log('⏹️ Stopping timer for current question:', currentQ.id);
      stopCurrentTimer();
      
      // Mark current question as visited if not already
      if (getQuestionStatus(currentQ.id) === 'NOT_VISITED') {
        updateAnswer(currentQ.id, { status: 'NOT_ANSWERED' });
      }
    }

    // Update navigation state
    setCurrentSection(sectionIndex);
    setCurrentQuestion(questionIndex);
    
    // Use setTimeout to ensure state updates are processed before starting new timer
    setTimeout(() => {
      // Start timer for new question
      if (newQuestionId) {
        console.log('⏱️ Starting timer for new question:', newQuestionId);
        startQuestionTimer(newQuestionId);
        
        // Mark the new question as visited immediately
        if (getQuestionStatus(newQuestionId) === 'NOT_VISITED') {
          updateAnswer(newQuestionId, { status: 'NOT_ANSWERED' });
        }
      }
    }, 10); // Small delay to ensure state updates are processed
  };

  const handleNext = () => {
    // Navigate to next question
    const allQuestions = getAllQuestions();
    const currentGlobalIndex = attempt.test.sections
      .slice(0, currentSection)
      .reduce((sum, section) => sum + section.questions.length, 0) + currentQuestion;

    if (currentGlobalIndex < allQuestions.length - 1) {
      // Find next question's section and index
      let nextGlobalIndex = currentGlobalIndex + 1;
      let nextSectionIndex = 0;
      let nextQuestionIndex = nextGlobalIndex;

      for (let i = 0; i < attempt.test.sections.length; i++) {
        if (nextQuestionIndex < attempt.test.sections[i].questions.length) {
          nextSectionIndex = i;
          break;
        }
        nextQuestionIndex -= attempt.test.sections[i].questions.length;
        nextSectionIndex = i + 1;
      }

      navigateToQuestion(nextSectionIndex, nextQuestionIndex);
    }
  };

  const handlePrevious = () => {
    // Navigate to previous question
    const currentGlobalIndex = attempt.test.sections
      .slice(0, currentSection)
      .reduce((sum, section) => sum + section.questions.length, 0) + currentQuestion;

    if (currentGlobalIndex > 0) {
      // Find previous question's section and index
      let prevGlobalIndex = currentGlobalIndex - 1;
      let prevSectionIndex = 0;
      let prevQuestionIndex = prevGlobalIndex;

      for (let i = 0; i < attempt.test.sections.length; i++) {
        if (prevQuestionIndex < attempt.test.sections[i].questions.length) {
          prevSectionIndex = i;
          break;
        }
        prevQuestionIndex -= attempt.test.sections[i].questions.length;
        prevSectionIndex = i + 1;
      }

      navigateToQuestion(prevSectionIndex, prevQuestionIndex);
    }
  };

  const handleMarkReviewAndNext = () => {
    const question = getCurrentQuestion();
    if (!question) return;
    
    // Set the status to MARKED_FOR_REVIEW
    updateAnswer(question.id, { 
      status: 'MARKED_FOR_REVIEW'
    });
    
    // Navigate to next question using proper navigation function
    const allQuestions = getAllQuestions();
    const currentGlobalIndex = attempt.test.sections
      .slice(0, currentSection)
      .reduce((sum, section) => sum + section.questions.length, 0) + currentQuestion;

    if (currentGlobalIndex < allQuestions.length - 1) {
      // Find next question's section and index
      let nextGlobalIndex = currentGlobalIndex + 1;
      let nextSectionIndex = 0;
      let nextQuestionIndex = nextGlobalIndex;

      for (let i = 0; i < attempt.test.sections.length; i++) {
        if (nextQuestionIndex < attempt.test.sections[i].questions.length) {
          nextSectionIndex = i;
          break;
        }
        nextQuestionIndex -= attempt.test.sections[i].questions.length;
        nextSectionIndex = i + 1;
      }

      // Use navigateToQuestion to ensure proper timer management
      navigateToQuestion(nextSectionIndex, nextQuestionIndex);
    }
  };

  const handleClearResponse = () => {
    const question = getCurrentQuestion();
    if (!question) return;

    updateAnswer(question.id, {
      selectedOption: null,
      integerAnswer: null,
      status: 'NOT_ANSWERED'
    });
  };



  if (loading) {
    return (
      <div className="fullscreen-container flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading test...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="fullscreen-container flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load test</p>
          <button
            onClick={() => navigate('/student')}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = getCurrentQuestion();
  const currentSection_obj = attempt?.test?.sections?.[currentSection];

  return (
    <div className="fullscreen-container bg-white flex flex-col">
      {/* Header 1 - Fixed */}
      <div className="bg-blue-900 text-white px-6 py-3 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <img 
            src="/nta-logo.png" 
            alt="NTA Logo" 
            className="h-10"
          />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            {candidateImage && (
              <img 
                src={candidateImage} 
                alt="Candidate" 
                className="w-10 h-10 object-cover"
                style={{ aspectRatio: '1/1' }}
              />
            )}
            <span className="font-medium">{candidateName}</span>
          </div>
          <div className="text-right">
            <div className="text-sm">Remaining Time:</div>
            <div className="text-lg font-bold text-yellow-300">{formattedTime}</div>
          </div>
        </div>
      </div>

      {/* Header 2 - Section Navigation - Fixed */}
      <div className="bg-gray-100 px-6 py-2 border-b flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {attempt?.test?.sections?.map((section, index) => (
              <button
                key={section.id}
                onClick={() => navigateToQuestion(index, 0)}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  currentSection === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {section.name}
              </button>
            ))}
          </div>
          
          {/* Submit Test Button */}
          <button
            onClick={() => handleSubmitTest(false)}
            disabled={submitting}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 font-medium disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </button>
        </div>
      </div>

      {/* Main Content Area - Flexible */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Question Area with Fixed Buttons */}
        <div className="flex-1 flex flex-col">
          {/* Question Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-6">
              {!currentQ && attempt && (
                <div className="text-center py-8">
                  <p className="text-red-600 mb-4">No questions found in this test</p>
                  <p className="text-gray-600">Test ID: {attempt.testId}</p>
                  <p className="text-gray-600">Sections: {attempt?.test?.sections?.length || 0}</p>
                  <p className="text-gray-600">Current Section: {currentSection}</p>
                </div>
              )}
              
              {currentQ && currentSection_obj && (
                <>
                  {currentSection_obj.questionType === 'MCQ' ? (
                    <MCQQuestion
                      question={currentQ}
                      answer={answers[currentQ.id]}
                      onAnswerChange={(answerData) => updateAnswer(currentQ.id, answerData)}
                      questionNumber={currentQuestion + 1}
                    />
                  ) : (
                    <IntegerQuestion
                      question={currentQ}
                      answer={answers[currentQ.id]}
                      onAnswerChange={(answerData) => updateAnswer(currentQ.id, answerData)}
                      questionNumber={currentQuestion + 1}
                    />
                  )}
                </>
              )}
            </div>
          </div>

          {/* Fixed Action Buttons */}
          {currentQ && currentSection_obj && (
            <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handlePrevious}
                  disabled={currentSection === 0 && currentQuestion === 0}
                  className="btn-previous"
                >
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  className="btn-next"
                >
                  Next
                </button>
                <button
                  onClick={handleMarkReviewAndNext}
                  className="btn-mark-review"
                >
                  Mark for Review & Next
                </button>
                <button
                  onClick={handleClearResponse}
                  className="btn-clear"
                >
                  Clear Response
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Question Palette - Fixed */}
        <div className="w-80 bg-gray-50 border-l flex-shrink-0 overflow-y-auto scrollbar-hide">
          <div className="p-4">
            {attempt?.test?.sections && (
              <QuestionPalette
                sections={attempt.test.sections}
                currentSection={currentSection}
                currentQuestion={currentQuestion}
                answers={answers}
                onQuestionClick={navigateToQuestion}
              />
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <SubmitConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSubmit={() => handleConfirmSubmit(false)}
        attempt={attempt}
        answers={answers}
        submitting={submitting}
      />

      {/* Warning Modal for Violations */}
      <WarningModal
        isOpen={showWarningModal}
        onOk={handleWarningOk}
        onTimeout={handleWarningTimeout}
        reason="window switching or Alt+Tab"
      />

      {/* Error/Success Modal */}
      <Modal
        isOpen={errorModal.show}
        onClose={() => setErrorModal({ show: false, title: '', message: '' })}
        title={errorModal.title}
        showCloseButton={!submitting}
      >
        <div className="text-center">
          <p className="text-gray-700 mb-4">{errorModal.message}</p>
          {!submitting && (
            <button
              onClick={() => setErrorModal({ show: false, title: '', message: '' })}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              OK
            </button>
          )}
        </div>
      </Modal>

      {/* Time Up Modal */}
      <Modal
        isOpen={showTimeUpModal}
        onClose={() => {}} // Prevent closing
        title="Time Completed"
        showCloseButton={false}
      >
        <div className="text-center">
          <div className="mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          </div>
          <p className="text-gray-700 mb-4">
            Time is completed! Your test is being submitted automatically.
          </p>
          <p className="text-sm text-red-600 font-medium">
            Please do not leave this page or close the browser.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default TestWindow;