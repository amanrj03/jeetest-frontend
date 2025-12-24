import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const WarningModal = ({ 
  isOpen, 
  onOk, 
  onTimeout, 
  warningCount,
  reason = 'window switching'
}) => {
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(60);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onTimeout]);

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={() => {}} // Prevent closing by clicking outside
      title="⚠️ Test Violation Warning"
      showCloseButton={false}
    >
      <div className="text-center space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <h3 className="text-lg font-semibold mb-2">
              Warning {warningCount}/5
            </h3>
            <p className="mb-2">
              You have been detected {reason} during the test. This is not allowed.
            </p>
            <p className="text-sm text-red-600">
              Click OK button under <span className="font-bold text-xl text-red-700">{countdown}</span> seconds 
              otherwise test will get submitted automatically.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-800 text-sm">
            After 5 warnings or if you don't respond in time, your test will be auto-submitted without confirmation.
          </p>
        </div>

        <div className="pt-4">
          <button
            onClick={onOk}
            className="bg-blue-600 text-white px-8 py-3 rounded-md hover:bg-blue-700 font-medium text-lg"
          >
            OK - I Understand
          </button>
        </div>

        <div className="text-center">
          <div className="text-3xl font-bold text-red-600">{countdown}</div>
          <div className="text-sm text-gray-600">seconds remaining</div>
        </div>
      </div>
    </Modal>
  );
};

export default WarningModal;