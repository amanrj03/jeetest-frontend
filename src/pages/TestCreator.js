import React, { useState, useEffect, useRef } from 'react';
import { testAPI, attemptAPI } from '../services/api';
import { keepAliveService } from '../services/keepAlive';
import SmartImageInput from '../components/SmartImageInput';
import Modal from '../components/Modal';

const TestCreator = () => {
  const [testName, setTestName] = useState('');
  const [duration, setDuration] = useState({ hours: 3, minutes: 0 });
  const [sections, setSections] = useState([
    {
      name: 'Physics',
      questionType: 'MCQ',
      questions: []
    }
  ]);
  const [tests, setTests] = useState([]);
  const [resumeRequests, setResumeRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null });
  
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
    
    return () => {
      isMountedRef.current = false;
      clearInterval(resumeRequestsInterval);
      // Stop keep-alive when leaving creator dashboard
      keepAliveService.stop('TestCreator');
    };
  }, []);

  const fetchTests = async () => {
    try {
      if (!isMountedRef.current) return;
      const response = await testAPI.getAllTests();
      if (isMountedRef.current) {
        setTests(response.data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
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
        message: 'Failed to grant resume permission',
        type: 'error'
      });
    }
  };

  const addSection = () => {
    setSections([...sections, {
      name: `Section ${sections.length + 1}`,
      questionType: 'MCQ',
      questions: []
    }]);
  };

  const updateSection = (index, field, value) => {
    const updatedSections = [...sections];
    updatedSections[index][field] = value;
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
    console.log(`Updating Q${questionIndex} field "${field}" to:`, value, `(type: ${typeof value})`);
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
    console.log(`After update, Q${questionIndex}.${field} =`, updatedSections[sectionIndex].questions[questionIndex][field]);
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

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', testName);
      formData.append('duration', duration.hours * 60 + duration.minutes);
      
      // Remove the 'id' field from questions before sending to backend
      const cleanSections = sections.map(section => ({
        name: section.name,
        questionType: section.questionType,
        questions: section.questions.map(({ id, ...question }) => question) // Remove id field
      }));
      
      console.log('📤 Sending to backend:', JSON.stringify(cleanSections, null, 2));
      formData.append('sections', JSON.stringify(cleanSections));

      // Append image files
      sections.forEach((section, sectionIndex) => {
        section.questions.forEach((question, questionIndex) => {
          if (question.questionImage) {
            formData.append(`sections[${sectionIndex}].questions[${questionIndex}].questionImage`, question.questionImage);
          }
          if (question.solutionImage) {
            formData.append(`sections[${sectionIndex}].questions[${questionIndex}].solutionImage`, question.solutionImage);
          }
        });
      });

      if (editingTest) {
        await testAPI.updateTest(editingTest.id, formData);
        setModal({
          show: true,
          title: 'Success',
          message: 'Test updated successfully!',
          type: 'success'
        });
      } else {
        await testAPI.createTest(formData);
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
        message: 'Failed to save test',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTestName('');
    setDuration({ hours: 3, minutes: 0 });
    setSections([{
      name: 'Physics',
      questionType: 'MCQ',
      questions: []
    }]);
    setEditingTest(null);
  };

  const editTest = (test) => {
    setEditingTest(test);
    setTestName(test.name);
    setDuration({ 
      hours: Math.floor(test.duration / 60), 
      minutes: test.duration % 60 
    });
    
    // Convert test sections to form format
    const formSections = test.sections.map(section => ({
      name: section.name,
      questionType: section.questionType,
      questions: section.questions.map((question, idx) => ({
        id: question.id || `q-${Date.now()}-${idx}`, // Add ID if not present
        questionImage: question.questionImage,
        solutionImage: question.solutionImage,
        correctOption: question.correctOption,
        correctInteger: question.correctInteger?.toString() || ''
      }))
    }));
    
    setSections(formSections);
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
        message: 'Failed to update test status. Please try again.',
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
            message: 'Failed to delete test',
            type: 'error'
          });
        }
      }
    });
  };

  const categorizeTests = () => {
    const newTests = tests.filter(test => !test.isLive && (!test.attempts || test.attempts.length === 0));
    const liveTests = tests.filter(test => test.isLive);
    const attemptedTests = tests.filter(test => !test.isLive && test.attempts && test.attempts.some(attempt => attempt.isCompleted));
    
    return { newTests, liveTests, attemptedTests };
  };

  // Helper function to get resume requests for a specific test
  const getResumeRequestsForTest = (testId) => {
    return resumeRequests.filter(request => request.test.id === testId);
  };

  const { newTests, liveTests, attemptedTests } = categorizeTests();

  return (
    <>
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">JEE Test Creator</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Test Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                {editingTest ? 'Edit Test' : 'Create Test'}
              </h2>
              {editingTest && (
                <button
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Cancel Edit
                </button>
              )}
            </div>
            
            {/* Test Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Test Name</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter test name"
              />
            </div>

            {/* Duration */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Test Duration</label>
              <div className="flex gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={duration.hours}
                    onChange={(e) => setDuration({...duration, hours: parseInt(e.target.value) || 0})}
                    className="w-20 p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={duration.minutes}
                    onChange={(e) => setDuration({...duration, minutes: parseInt(e.target.value) || 0})}
                    className="w-20 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Sections</h3>
                <button
                  onClick={addSection}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  + Add Section
                </button>
              </div>

              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-md p-4 mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-md font-medium">Section {sectionIndex + 1}</h4>
                    <button
                      onClick={() => deleteSection(sectionIndex)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 text-sm"
                      title="Delete Section"
                    >
                      🗑️ Delete Section
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Section Name</label>
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => updateSection(sectionIndex, 'name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Question Type</label>
                      <select
                        value={section.questionType}
                        onChange={(e) => updateSection(sectionIndex, 'questionType', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="MCQ">MCQ</option>
                        <option value="INTEGER">Integer Type</option>
                      </select>
                    </div>
                  </div>

                  {/* Questions */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Questions ({section.questions.length})</h4>
                      <button
                        onClick={() => addQuestion(sectionIndex)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 text-sm"
                      >
                        + Add Question
                      </button>
                    </div>

                    {section.questions.map((question, questionIndex) => (
                      <div key={question.id} className="bg-gray-50 p-3 rounded-md mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-medium">Question {questionIndex + 1}</h5>
                          <button
                            onClick={() => deleteQuestion(sectionIndex, questionIndex)}
                            className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            title="Delete Question"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
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
                          <label className="block text-sm font-medium mb-1">
                            {section.questionType === 'MCQ' ? 'Correct Option' : 'Correct Integer'}
                          </label>
                          {section.questionType === 'MCQ' ? (
                            <select
                              value={question.correctOption}
                              onChange={(e) => updateQuestion(sectionIndex, questionIndex, 'correctOption', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
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
                              className="w-full p-2 border border-gray-300 rounded-md"
                              placeholder="Enter correct integer answer"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={createTest}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (editingTest ? 'Updating Test...' : 'Creating Test...') : (editingTest ? 'Update Test' : 'Create Test')}
            </button>
          </div>

          {/* Test List Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-6">Test List</h2>
            
            {/* New Tests */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-gray-700">New Tests (Not Live)</h3>
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

            {/* Live Tests */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3 text-green-700">Live Tests</h3>
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

            {/* Attempted Tests */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-blue-700">Attempted Tests</h3>
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
          </div>
        </div>
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