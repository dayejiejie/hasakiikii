import React from 'react';

interface UploadProgressProps {
  progress: number;
  fileName: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({ progress, fileName }) => {
  return (
    <div className="w-full max-w-md">
      <div className="mb-2 flex justify-between text-sm">
        <span className="text-gray-700 dark:text-gray-300">{fileName}</span>
        <span className="text-gray-700 dark:text-gray-300">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-2 rounded-full bg-blue-500 transition-all duration-300 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}; 