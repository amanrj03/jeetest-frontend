import { useState, useEffect, useRef } from 'react';
import { testAPI, attemptAPI } from '../services/api';
import { keepAliveService } from '../services/keepAlive';
import SmartImageInput from '../components/SmartImageInput';
import Modal from '../components/Modal';

// Chevron Down Icon Component
const ChevronDownIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// Chevron Right Icon Component  
const ChevronRightIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const TestCreator = () => {
  const [testName, setTestName] = useState('');
  const [duration, setDuration] = useState({ hours: 3, minutes: 0 });
  const [sections, setSections] = useState([
    {
      name: 'Physics',
      questionType: 'MCQ',
      questions: [],
      isExpanded: false // Add collapsed state for each section
    }
  ]);
  const [tests, setTests] = useState([]);
  const [resumeRequests, setResumeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveDraftLoading, setSaveDraftLoading] = useState(false);
  const [createTestLoading, setCreateTestLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingTest, setEditingTest] = useState(null);
  const [editMode, setEditMode] = useState('create'); // 'create', 'edit', 'continue'
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
  const [activeTab, setActiveTab] = useState('create');
  
  // Track if component is mounted to prevent API calls after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTests();
    fetchResumeRequests();
    
    // Start keep-alive service for creator dashboard
    keepAliveService.start('TestCreator');
    
    // Set up periodic refresh for resume requests
    const resumeRequestsInterval = setInterval(() => {
      if (isMountedRef.current) {
        fetchResumeRequests();
      }
    }, 10000); // Refresh every 10 seconds
    
    // Keyboard shortcut for saving draft (Ctrl+D)
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault(); // Prevent browser's default bookmark action
        if (activeTab === 'create') {
          saveDraft();
        }
      }
    };
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      isMountedRef.current = false;
      clearInterval(resumeRequestsInterval);
      document.removeEventListener('keydown', handleKeyDown);
      // Stop keep-alive when leaving creator dashboard
      keepAliveService.stop('TestCreator');
    };
  }, [activeTab]); // Add activeTab as dependency

  const fetchTests = async () => {
    try {
      if (!isMountedRef.current) return;
      const response = await testAPI.getAllTests();
      if (isMountedRef.current) {
        setTests(response.data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      if (isMountedRef.current) {
        setModal({
          show: true,
          title: 'Connection Error',
          message: error.userMessage || 'Failed to load tests. Please check your internet connection and try again.',
          type: 'error'
        });
      }
    }
  };

  const fetchResumeRequests = async () => {
    try {
      if (!isMountedRef.current) return;
      const response = await attemptAPI.getResumeRequests();
      if (isMountedRef.current) {
        setResumeRequests(response.data);
      }
    } catch (error) {
      console.error('Error fetching resume requests:', error);
      // Don't show modal for resume requests as it's a background operation
      // Just log the error
    }
  };

  const handleAllowResume = async (attemptId) => {
    try {
      await attemptAPI.allowResume({ attemptId });
      fetchResumeRequests();
      fetchTests(); // Refresh tests to update the UI
      setModal({
        show: true,
        title: 'Success',
        message: 'Resume permission granted successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error('Error allowing resume:', error);
      setModal({
        show: true,
        title: 'Error',
        message: error.userMessage || 'Failed to grant resume permission. Please check your internet connection and try again.',
        type: 'error'
      });
    }
  };

  const addSection = () => {
    setSections([...sections, {
      name: `Section ${sections.length + 1}`,
      questionType: 'MCQ',
      questions: [],
      isExpanded: false
    }]);
  };

  const updateSection = (index, field, value) => {
    const updatedSections = [...sections];
    updatedSections[index][field] = value;
    setSections(updatedSections);
  };

  const toggleSectionExpanded = (index) => {
    const updatedSections = sections.map((section, idx) => ({
      ...section,
      // If clicking on the same section that's already open, close it
      // If clicking on a different section, close all others and open this one
      isExpanded: idx === index ? !section.isExpanded : false
    }));
    setSections(updatedSections);
  };

  const deleteSection = (index) => {
    if (sections.length <= 1) {
      setModal({
        show: true,
        title: 'Cannot Delete Section',
        message: 'At least one section is required',
        type: 'warning'
      });
      return;
    }
    const updatedSections = sections.filter((_, i) => i !== index);
    setSections(updatedSections);
  };

  const addQuestion = (sectionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions.push({
      id: `q-${Date.now()}-${Math.random()}`, // Unique ID for each question
      questionImage: null,
      solutionImage: null,
      correctOption: 'A',
      correctInteger: ''
    });
    setSections(updatedSections);
  };

  const updateQuestion = (sectionIndex, questionIndex, field, value) => {
    const updatedSections = sections.map((section, sIdx) => {
      if (sIdx !== sectionIndex) return section;
      return {
        ...section,
        questions: section.questions.map((question, qIdx) => {
          if (qIdx !== questionIndex) return question;
          return { ...question, [field]: value };
        })
      };
    });
    setSections(updatedSections);
  };

  const deleteQuestion = (sectionIndex, questionIndex) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions = updatedSections[sectionIndex].questions.filter((_, i) => i !== questionIndex);
    setSections(updatedSections);
  };

  const handleImageUpload = (sectionIndex, questionIndex, field, file) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex].questions[questionIndex][field] = file;
    setSections(updatedSections);
  };

  const saveDraft = async () => {
    if (!testName.trim()) {
      setModal({
        show: true,
        title: 'Validation Error',
        message: 'Please enter test name',
        type: 'warning'
      });
      return;
    }

    setSaveDraftLoading(true);
    setLoading(true); // Keep this for progress bar
    try {
      const formData = new FormData();
      formData.append('name', testName);
      formData.append('duration', duration.hours * 60 + duration.minutes);
      formData.append('isDraft', 'true'); // Always save as draft
      
      // Process sections and handle existing URLs vs new files
      const cleanSections = sections.map(section => ({
        name: section.name,
        questionType: section.questionType,
        questions: section.questions.map(({ id, ...question }) => {
          // For existing URLs, pass them as strings in the sections data
          // For new files, they'll be handled separately in FormData
          return {
            ...question,
            // Keep existing URLs as strings, new files will be null here
            questionImage: typeof question.questionImage === 'string' ? question.questionImage : null,
            solutionImage: typeof question.solutionImage === 'string' ? question.solutionImage : null
          };
        })
      }));
      
      formData.append('sections', JSON.stringify(cleanSections));

      // Append only new image files (File objects)
      sections.forEach((section, sectionIndex) => {
        section.questions.forEach((question, questionIndex) => {
          // Only append if it's a File object (new upload)
          if (question.questionImage && typeof question.questionImage === 'object' && question.questionImage.name) {
            formData.append(`sections[${sectionIndex}].questions[${questionIndex}].questionImage`, question.questionImage);
          }
          if (question.solutionImage && typeof question.solutionImage === 'object' && question.solutionImage.name) {
            formData.append(`sections[${sectionIndex}].questions[${questionIndex}].solutionImage`, question.solutionImage);
          }
        });
      });

      // Upload progress callback
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      };

      if (editingTest) {
        // When updating an existing test (draft or continuing), always keep as draft
        await testAPI.updateTest(editingTest.id, formData, onUploadProgress);
        setModal({
          show: true,
          title: 'Success',
          message: 'Draft saved successfully!',
          type: 'success'
        });
      } else {
        // Creating new draft
        await testAPI.saveDraft(formData, onUploadProgress);
        setModal({
          show: true,
          title: 'Success',
          message: 'Draft saved successfully!',
          type: 'success'
        });
      }
      
      // Reset form
      resetForm();
      fetchTests();
    } catch (error) {
      console.error('Error saving draft:', error);
      setModal({
        show: true,
        title: 'Error',
        message: error.userMessage || 'Failed to save draft. Please check your internet connection and try again.',
        type: 'error'
      });
    } finally {
      setSaveDraftLoading(false);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const createTest = async () => {
    if (!testName.trim()) {
      setModal({
        show: true,
        title: 'Validation Error',
        message: 'Please enter test name',
        type: 'warning'
      });
      return;
    }

    if (sections.some(section => section.questions.length === 0)) {
      setModal({
        show: true,
        title: 'Validation Error',
        message: 'Each section must have at least one question',
        type: 'warning'
      });
      return;
    }

    // Validate that all questions have required fields
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex];
      for (let questionIndex = 0; questionIndex < section.questions.length; questionIndex++) {
        const question = section.questions[questionIndex];
        
        // Check if question image is missing
        if (!question.questionImage) {
          setModal({
            show: true,
            title: 'Validation Error',
            message: `Question ${questionIndex + 1} in ${section.name} is missing a question image`,
            type: 'warning'
          });
          return;
        }
        
        // Check if solution image is missing
        if (!question.solutionImage) {
          setModal({
            show: true,
            title: 'Validation Error',
            message: `Question ${questionIndex + 1} in ${section.name} is missing a solution image`,
            type: 'warning'
          });
          return;
        }
        
        // Check if answer is missing
        if (section.questionType === 'MCQ') {
          if (!question.correctOption) {
            setModal({
              show: true,
              title: 'Validation Error',
              message: `Question ${questionIndex + 1} in ${section.name} is missing the correct option`,
              type: 'warning'
            });
            return;
          }
        } else {
          if (!question.correctInteger && question.correctInteger !== 0) {
            setModal({
              show: true,
              title: 'Validation Error',
              message: `Question ${questionIndex + 1} in ${section.name} is missing the correct integer answer`,
              type: 'warning'
            });
            return;
          }
        }
      }
    }

    setCreateTestLoading(true);
    setLoading(true); // Keep this for progress bar
    try {
      const formData = new FormData();
      formData.append('name', testName);
      formData.append('duration', duration.hours * 60 + duration.minutes);
      formData.append('isDraft', 'false');
      
      // Process sections and handle existing URLs vs new files
      const cleanSections = sections.map(section => ({
        name: section.name,
        questionType: section.questionType,
        questions: section.questions.map(({ id, ...question }) => {
          // For existing URLs, pass them as strings in the sections data
          // For new files, they'll be handled separately in FormData
          return {
            ...question,
            // Keep existing URLs as strings, new files will be null here
            questionImage: typeof question.questionImage === 'string' ? question.questionImage : null,
            solutionImage: typeof question.solutionImage === 'string' ? question.solutionImage : null
          };
        })
      }));
      
      formData.append('sections', JSON.stringify(cleanSections));

      // Append only new image files (File objects)
      sections.forEach((section, sectionIndex) => {
        section.questions.forEach((question, questionIndex) => {
          // Only append if it's a File object (new upload)
          if (question.questionImage && typeof question.questionImage === 'object' && question.questionImage.name) {
            formData.append(`sections[${sectionIndex}].questions[${questionIndex}].questionImage`, question.questionImage);
          }
          if (question.solutionImage && typeof question.solutionImage === 'object' && question.solutionImage.name) {
            formData.append(`sections[${sectionIndex}].questions[${questionIndex}].solutionImage`, question.solutionImage);
          }
        });
      });

      // Upload progress callback
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      };

      if (editingTest && editMode === 'edit') {
        formData.append('isDraft', 'false'); // Make sure it's not a draft when updating from edit
        await testAPI.updateTest(editingTest.id, formData, onUploadProgress);
        setModal({
          show: true,
          title: 'Success',
          message: 'Test updated successfully!',
          type: 'success'
        });
      } else if (editingTest && editMode === 'continue') {
        formData.append('isDraft', 'false'); // Convert draft to final test
        await testAPI.updateTest(editingTest.id, formData, onUploadProgress);
        setModal({
          show: true,
          title: 'Success',
          message: 'Test created successfully!',
          type: 'success'
        });
      } else {
        await testAPI.createTest(formData, onUploadProgress);
        setModal({
          show: true,
          title: 'Success',
          message: 'Test created successfully!',
          type: 'success'
        });
      }
      
      // Reset form
      resetForm();
      fetchTests();
    } catch (error) {
      console.error('Error saving test:', error);
      setModal({
        show: true,
        title: 'Error',
        message: error.userMessage || 'Failed to save test. Please check your internet connection and try again.',
        type: 'error'
      });
    } finally {
      setCreateTestLoading(false);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setTestName('');
    setDuration({ hours: 3, minutes: 0 });
    setSections([{
      name: 'Physics',
      questionType: 'MCQ',
      questions: [],
      isExpanded: false
    }]);
    setEditingTest(null);
    setEditMode('create');
    // Reset loading states
    setSaveDraftLoading(false);
    setCreateTestLoading(false);
    setLoading(false);
    setUploadProgress(0);
  };

  const editTest = (test) => {
    setEditingTest(test);
    setEditMode('edit'); // Set mode to edit
    setTestName(test.name);
    setDuration({ 
      hours: Math.floor(test.duration / 60), 
      minutes: test.duration % 60 
    });
    
    // Convert test sections to form format
    const formSections = test.sections.map(section => ({
      name: section.name,
      questionType: section.questionType,
      isExpanded: false, // Start collapsed when editing
      questions: section.questions.map((question, idx) => ({
        id: question.id || `q-${Date.now()}-${idx}`, // Add ID if not present
        questionImage: question.questionImage,
        solutionImage: question.solutionImage,
        correctOption: question.correctOption,
        correctInteger: question.correctInteger?.toString() || ''
      }))
    }));
    
    setSections(formSections);
    setActiveTab('create'); // Switch to create tab when editing
    
    // Reset loading states when editing
    setSaveDraftLoading(false);
    setCreateTestLoading(false);
    setLoading(false);
    setUploadProgress(0);
  };

  const continueCreating = (test) => {
    setEditingTest(test);
    setEditMode('continue'); // Set mode to continue
    setTestName(test.name);
    setDuration({ 
      hours: Math.floor(test.duration / 60), 
      minutes: test.duration % 60 
    });
    
    // Convert test sections to form format
    const formSections = test.sections.map(section => ({
      name: section.name,
      questionType: section.questionType,
      isExpanded: false, // Start collapsed when continuing
      questions: section.questions.map((question, idx) => ({
        id: question.id || `q-${Date.now()}-${idx}`, // Add ID if not present
        questionImage: question.questionImage,
        solutionImage: question.solutionImage,
        correctOption: question.correctOption,
        correctInteger: question.correctInteger?.toString() || ''
      }))
    }));
    
    setSections(formSections);
    setActiveTab('create'); // Switch to create tab when continuing
    
    // Reset loading states when continuing
    setSaveDraftLoading(false);
    setCreateTestLoading(false);
    setLoading(false);
    setUploadProgress(0);
  };

  const toggleTestLive = async (testId, currentStatus) => {
    try {
      await testAPI.toggleTestLive(testId, !currentStatus);
      fetchTests();
    } catch (error) {
      console.error('Error updating test status:', error);
      setModal({
        show: true,
        title: 'Error',
        message: error.userMessage || 'Failed to update test status. Please check your internet connection and try again.',
        type: 'error'
      });
    }
  };

  const deleteTest = async (testId) => {
    setConfirmModal({
      show: true,
      title: 'Delete Test',
      message: 'Are you sure you want to delete this test? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await testAPI.deleteTest(testId);
          fetchTests();
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
          setModal({
            show: true,
            title: 'Success',
            message: 'Test deleted successfully!',
            type: 'success'
          });
        } catch (error) {
          console.error('Error deleting test:', error);
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null });
          setModal({
            show: true,
            title: 'Error',
            message: error.userMessage || 'Failed to delete test. Please check your internet connection and try again.',
            type: 'error'
          });
        }
      }
    });
  };

  const categorizeTests = () => {
    const pendingTests = tests.filter(test => test.isDraft);
    const newTests = tests.filter(test => !test.isDraft && !test.isLive && (!test.attempts || test.attempts.length === 0));
    const liveTests = tests.filter(test => test.isLive);
    const attemptedTests = tests.filter(test => !test.isLive && !test.isDraft && test.attempts && test.attempts.some(attempt => attempt.isCompleted));
    
    return { pendingTests, newTests, liveTests, attemptedTests };
  };

  // Helper function to get resume requests for a specific test
  const getResumeRequestsForTest = (testId) => {
    return resumeRequests.filter(request => request.test.id === testId);
  };

  const { pendingTests, newTests, liveTests, attemptedTests } = categorizeTests();

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                JEE Test Creator
              </h1>
              <p className="text-gray-600 text-sm mt-1">Create and manage your JEE practice tests</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('create')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                  activeTab === 'create' 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Test
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                  activeTab === 'pending' 
                    ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending ({pendingTests.length})
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                  activeTab === 'new' 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                New Tests ({newTests.length})
              </button>
              <button
                onClick={() => setActiveTab('live')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                  activeTab === 'live' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
                Live ({liveTests.length})
              </button>
              <button
                onClick={() => setActiveTab('attempted')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm ${
                  activeTab === 'attempted' 
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Attempted ({attemptedTests.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Create Test Tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {editingTest ? (
                    <>
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      {editMode === 'continue' ? 'Continue Creating Test' : 'Edit Test'}
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create New Test
                    </>
                  )}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <p className="text-gray-600 text-sm">
                    {editingTest 
                      ? (editMode === 'continue' 
                          ? `Continuing work on "${editingTest.name}" draft` 
                          : 'Modify your existing test'
                        )
                      : 'Build your JEE test with multiple sections and questions'
                    }
                  </p>
                  {!editingTest && editMode !== 'edit' && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Press <kbd className="bg-white px-1 py-0.5 rounded text-xs font-mono">Ctrl+D</kbd> to save draft</span>
                    </div>
                  )}
                </div>
              </div>
              {editingTest && (
                <button
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center gap-2 shadow-sm text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Edit
                </button>
              )}
            </div>
            
            {/* Test Name */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Test Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm"
                placeholder="Enter test name (e.g., JEE Main Mock Test 1)"
              />
            </div>

            {/* Duration */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Test Duration</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={duration.hours}
                    onChange={(e) => setDuration({...duration, hours: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center font-semibold"
                  />
                </div>
                <div className="flex items-center text-xl font-bold text-gray-400 mt-6">:</div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={duration.minutes}
                    onChange={(e) => setDuration({...duration, minutes: parseInt(e.target.value) || 0})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center font-semibold"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Total Duration: {duration.hours}h {duration.minutes}m ({duration.hours * 60 + duration.minutes} minutes)
              </p>
            </div>

            {/* Sections */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Test Sections</h3>
                <button
                  onClick={addSection}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Section
                </button>
              </div>

              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4 overflow-hidden">
                  {/* Section Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <div className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleSectionExpanded(sectionIndex)}
                            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                          >
                            {section.isExpanded ? (
                              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                            )}
                            <h4 className="text-base font-semibold">
                              Section {sectionIndex + 1}: {section.name}
                            </h4>
                          </button>
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            {section.questions.length} questions
                          </span>
                        </div>
                        <button
                          onClick={() => deleteSection(sectionIndex)}
                          className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors duration-200 flex items-center gap-1 shadow-sm text-xs"
                          title="Delete Section"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                      
                      {/* Section Configuration - Always Visible */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Section Name</label>
                          <input
                            type="text"
                            value={section.name}
                            onChange={(e) => updateSection(sectionIndex, 'name', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            placeholder="Enter section name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Question Type</label>
                          <select
                            value={section.questionType}
                            onChange={(e) => updateSection(sectionIndex, 'questionType', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                          >
                            <option value="MCQ">Multiple Choice (MCQ)</option>
                            <option value="INTEGER">Integer Type</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Questions Section */}
                  {section.isExpanded && (
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-base font-medium text-gray-800">Questions</h5>
                        <button
                          onClick={() => addQuestion(sectionIndex)}
                          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-1 text-xs"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Question
                        </button>
                      </div>

                      {section.questions.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-gray-500 text-sm">No questions added yet</p>
                          <p className="text-gray-400 text-xs mt-1">Click "Add Question" to get started</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {section.questions.map((question, questionIndex) => (
                            <div key={question.id} className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                              <div className="flex justify-between items-center mb-3">
                                <h6 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                  <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                                    {questionIndex + 1}
                                  </span>
                                  Question {questionIndex + 1}
                                </h6>
                                <button
                                  onClick={() => deleteQuestion(sectionIndex, questionIndex)}
                                  className="bg-red-500 text-white p-1 rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-sm"
                                  title="Delete Question"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                              
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <SmartImageInput
                                    label="Question Image"
                                    onImageChange={(file) => handleImageUpload(sectionIndex, questionIndex, 'questionImage', file)}
                                    currentImage={question.questionImage}
                                    placeholder="Add question image"
                                  />
                                  <SmartImageInput
                                    label="Solution Image"
                                    onImageChange={(file) => handleImageUpload(sectionIndex, questionIndex, 'solutionImage', file)}
                                    currentImage={question.solutionImage}
                                    placeholder="Add solution image"
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">
                                    {section.questionType === 'MCQ' ? 'Correct Option' : 'Correct Integer Answer'}
                                  </label>
                                  {section.questionType === 'MCQ' ? (
                                    <select
                                      value={question.correctOption}
                                      onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'correctOption', e.target.value)}
                                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                    >
                                      <option value="A">Option A</option>
                                      <option value="B">Option B</option>
                                      <option value="C">Option C</option>
                                      <option value="D">Option D</option>
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      inputMode="numeric"
                                      value={String(question.correctInteger || '')}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        // Only allow integers (positive, negative, or zero)
                                        if (value === '' || /^-?\d+$/.test(value)) {
                                          updateQuestion(sectionIndex, questionIndex, 'correctInteger', value);
                                        }
                                      }}
                                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                                      placeholder="Enter correct integer answer"
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Progress Bar */}
            {loading && uploadProgress > 0 && (
              <div className="w-full mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {editMode === 'edit' ? (
                // Only Update Test button when editing from New Tests section
                <button
                  onClick={createTest}
                  disabled={createTestLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {createTestLoading ? `Updating Test... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` : 'Update Test'}
                </button>
              ) : editMode === 'continue' ? (
                // When continuing a draft, show both Save Draft and Create Test buttons
                <>
                  <button
                    onClick={saveDraft}
                    disabled={saveDraftLoading || createTestLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold relative group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {saveDraftLoading ? `Saving Draft... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` : 'Save Draft'}
                    
                    {/* Keyboard shortcut tooltip */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Press Ctrl+D
                    </div>
                  </button>
                  <button
                    onClick={createTest}
                    disabled={saveDraftLoading || createTestLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {createTestLoading ? `Creating Test... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` : 'Create Test'}
                  </button>
                </>
              ) : (
                // When creating new test, show both Save Draft and Create Test buttons
                <>
                  <button
                    onClick={saveDraft}
                    disabled={saveDraftLoading || createTestLoading}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold relative group"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {saveDraftLoading ? `Saving Draft... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` : 'Save Draft'}
                    
                    {/* Keyboard shortcut tooltip */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Press Ctrl+D
                    </div>
                  </button>
                  <button
                    onClick={createTest}
                    disabled={saveDraftLoading || createTestLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-semibold"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {createTestLoading ? `Creating Test... ${uploadProgress > 0 ? `${uploadProgress}%` : ''}` : 'Create Test'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Pending Tests Tab */}
        {activeTab === 'pending' && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending Tests
              </h2>
              <p className="text-gray-600 text-sm mt-1">Continue working on your draft tests</p>
            </div>
            {pendingTests.length === 0 ? (
              <div className="text-center py-12 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg border-2 border-dashed border-orange-300">
                <svg className="w-12 h-12 text-orange-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-orange-600 text-lg font-semibold">No pending tests</p>
                <p className="text-orange-500 text-sm mt-1">Save a draft from the Create Test section to see it here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {pendingTests.map(test => (
                  <div key={test.id} className="border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{test.name}</h4>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m
                          </span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Total Marks: {test.totalMarks}
                          </span>
                        </div>
                        <span className="inline-block bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-semibold">
                          DRAFT
                        </span>
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => continueCreating(test)}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-semibold text-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Continue Creating
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Tests Tab */}
        {activeTab === 'new' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">New Tests (Not Live)</h2>
            {newTests.length === 0 ? (
              <p className="text-gray-500">No new tests</p>
            ) : (
              newTests.map(test => (
                <div key={test.id} className="border border-gray-200 rounded-md p-4 mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{test.name}</h4>
                      <p className="text-sm text-gray-600">Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m</p>
                      <p className="text-sm text-gray-600">Total Marks: {test.totalMarks}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTest(test)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleTestLive(test.id, test.isLive)}
                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                      >
                        Make Live
                      </button>
                      <button
                        onClick={() => window.open(`/preview/${test.id}`, '_blank')}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => deleteTest(test.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Live Tests Tab */}
        {activeTab === 'live' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Live Tests</h2>
            {liveTests.length === 0 ? (
              <p className="text-gray-500">No live tests</p>
            ) : (
              liveTests.map(test => {
                const testResumeRequests = getResumeRequestsForTest(test.id);
                return (
                  <div key={test.id} className="border border-green-200 bg-green-50 rounded-md p-4 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{test.name}</h4>
                        <p className="text-sm text-gray-600">Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m</p>
                        <p className="text-sm text-gray-600">Total Marks: {test.totalMarks}</p>
                        <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">LIVE</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleTestLive(test.id, test.isLive)}
                          className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                        >
                          Stop Live
                        </button>
                        <button
                          onClick={() => window.open(`/preview/${test.id}`, '_blank')}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                    
                    {/* Resume Requests for this test */}
                    {testResumeRequests.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                        <h5 className="text-sm font-medium text-yellow-800 mb-2">Resume Permission Requests</h5>
                        {testResumeRequests.map(request => (
                          <div key={request.id} className="bg-white p-2 rounded border mb-2 text-sm">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium">{request.candidateName}</p>
                                <p className="text-xs text-gray-600">
                                  Warnings: {request.warningCount} | Requested: {new Date(request.resumeRequestedAt).toLocaleString()}
                                </p>
                              </div>
                              <button
                                onClick={() => handleAllowResume(request.id)}
                                className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                              >
                                Allow Resume
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Attempted Tests Tab */}
        {activeTab === 'attempted' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Attempted Tests</h2>
            {attemptedTests.length === 0 ? (
              <p className="text-gray-500">No attempted tests</p>
            ) : (
              attemptedTests.map(test => (
                <div key={test.id} className="border border-blue-200 bg-blue-50 rounded-md p-4 mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{test.name}</h4>
                      <p className="text-sm text-gray-600">Duration: {Math.floor(test.duration / 60)}h {test.duration % 60}m</p>
                      <p className="text-sm text-gray-600">Total Marks: {test.totalMarks}</p>
                      <p className="text-sm text-gray-600">Attempts: {test.attempts.length}</p>
                      
                      {/* Show warning counts for completed attempts */}
                      {test.attempts.some(attempt => attempt.isCompleted && attempt.warningCount > 0) && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">High warnings: </span>
                          {test.attempts
                            .filter(attempt => attempt.isCompleted && attempt.warningCount > 0)
                            .map(attempt => (
                              <span
                                key={attempt.id}
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium mr-1 ${
                                  attempt.warningCount < 3
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {attempt.candidateName}: {attempt.warningCount}
                              </span>
                            ))
                          }
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(`/preview/${test.id}`, '_blank')}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>

    <>
    {/* Modal */}
    <Modal
      isOpen={modal.show}
      onClose={() => setModal({ show: false, title: '', message: '', type: 'info' })}
      title={modal.title}
    >
      <div className="text-center">
        <p className="text-gray-700 mb-4">{modal.message}</p>
        <button
          onClick={() => setModal({ show: false, title: '', message: '', type: 'info' })}
          className={`px-6 py-2 rounded-md text-white font-medium ${
            modal.type === 'success' ? 'bg-green-600 hover:bg-green-700' :
            modal.type === 'error' ? 'bg-red-600 hover:bg-red-700' :
            modal.type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
            'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          OK
        </button>
      </div>
    </Modal>

    {/* Confirmation Modal */}
    <Modal
      isOpen={confirmModal.show}
      onClose={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
      title={confirmModal.title}
      showCloseButton={false}
    >
      <div className="text-center">
        <p className="text-gray-700 mb-6">{confirmModal.message}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setConfirmModal({ show: false, title: '', message: '', onConfirm: null })}
            className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={confirmModal.onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
    </>
    </>
  );
};

export default TestCreator;