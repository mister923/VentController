import React, { useState } from 'react';

function FloorPlanUpload({ onImageLoad, hasImage }) {
  const [isExpanded, setIsExpanded] = useState(!hasImage);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      const image = new Image();

      reader.onload = (e) => {
        image.src = e.target.result;
        image.onload = () => {
          onImageLoad(image);
          setIsExpanded(false);
        };
      };

      reader.readAsDataURL(file);
    }
  };

  if (!isExpanded) {
    return (
      <div className="mb-4">
        <button
          onClick={() => setIsExpanded(true)}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Modify Floor Plan
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
        <div className="flex flex-col items-center space-y-2">
          <svg className="w-6 h-6 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-sm text-gray-600">
            <span className="font-medium text-blue-600 hover:underline">Upload a floor plan</span>
            <span className="text-gray-500"> or drag and drop</span>
          </div>
          <div className="text-xs text-gray-500">SVG, PNG, JPG up to 10MB</div>
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
      </label>
      <button
        onClick={() => setIsExpanded(false)}
        className="mt-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
      >
        Cancel
      </button>
    </div>
  );
}

export default FloorPlanUpload; 