import React, { useState, useRef, useEffect } from 'react';
import Modal from './Modal';

const SmartImageInput = ({ label, onImageChange, currentImage, placeholder }) => {
  const [dragOver, setDragOver] = useState(false);
  const [imagePreview, setImagePreview] = useState(currentImage || null);
  const [pasteReady, setPasteReady] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '' });
  const fileInputRef = useRef(null);
  const pasteAreaRef = useRef(null);

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      // Only handle paste if this component's area is focused or hovered
      if (pasteAreaRef.current && (document.activeElement === pasteAreaRef.current || pasteAreaRef.current.contains(document.activeElement))) {
        handlePaste(e);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);

  const handleImageFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Pass file to parent
      onImageChange(file);
    } else {
      setModal({
        show: true,
        title: 'Invalid File Type',
        message: 'Please select a valid image file (JPEG, PNG, GIF)'
      });
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handlePaste = async (e) => {
    e.preventDefault();
    const items = e.clipboardData?.items;
    
    if (items) {
      for (let item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleImageFile(file);
            // Show success feedback
            setPasteReady(true);
            setTimeout(() => setPasteReady(false), 2000);
            break;
          }
        }
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageFile(files[0]);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{label}</label>
      
      {/* Image Preview */}
      {imagePreview && (
        <div className="mb-3 relative">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-full h-32 object-contain border border-gray-300 rounded"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
          >
            ×
          </button>
        </div>
      )}

      {/* Smart Input Area - Only show when no image */}
      {!imagePreview && (
        <div
          ref={pasteAreaRef}
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragOver 
              ? 'border-blue-500 bg-blue-50' 
              : pasteReady
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          tabIndex={0}
          style={{ outline: 'none' }}
        >
        <div className="space-y-2">
          <div className="text-gray-600">
            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div className="text-sm text-gray-600">
            {pasteReady ? (
              <p className="font-medium text-green-600">✅ Image pasted successfully!</p>
            ) : (
              <>
                <p className="font-medium">Multiple ways to add image:</p>
                <p>• Click to browse files</p>
                <p>• Drag & drop image here</p>
                <p>• Copy image and paste (Ctrl+V)</p>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 text-sm"
          >
            Browse Files
          </button>
        </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}



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
    </div>
  );
};

export default SmartImageInput;