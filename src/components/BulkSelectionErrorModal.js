import React from 'react';
import Modal from './Modal';

const BulkSelectionErrorModal = ({ isOpen, onClose, error }) => {
  if (!error) return null;

  const getModalContent = () => {
    switch (error.type) {
      case 'wrongCount':
        return {
          title: 'Incorrect Number of Files',
          message: `Please select exactly ${error.expectedCount} files. You selected ${error.actualCount} files.`,
          icon: '📊'
        };
      case 'invalidFileType':
        return {
          title: 'Invalid File Types',
          message: `Only image files (JPG, PNG, GIF, WEBP) are allowed.\n\nInvalid files:\n${error.invalidFiles.join('\n')}`,
          icon: '⚠️'
        };
      case 'mixedErrors':
        return {
          title: 'Selection Error',
          message: `Multiple issues found:\n\n• Wrong count: Expected ${error.expectedCount}, got ${error.actualCount}\n• Invalid files: ${error.invalidFiles.join(', ')}`,
          icon: '❌'
        };
      default:
        return {
          title: 'Selection Error',
          message: 'An error occurred during bulk selection. Please try again.',
          icon: '❌'
        };
    }
  };

  const { title, message, icon } = getModalContent();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      showCloseButton={false}
    >
      <div className="text-center">
        <div className="text-4xl mb-4">{icon}</div>
        <div className="text-gray-700 mb-6 whitespace-pre-line text-left">
          {message}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkSelectionErrorModal;