import React, { useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { UploadProgress } from './UploadProgress';

export const Editor: React.FC<{
  content: string;
  onChange: (content: string) => void;
}> = ({ content, onChange }) => {
  const [currentFile, setCurrentFile] = useState<string>('');
  const { uploadFile, progress, uploading, error } = useFileUpload();

  const handleFileUpload = async (file: File) => {
    setCurrentFile(file.name);
    const result = await uploadFile(file);
    if (result) {
      // 根据文件类型插入不同的 Markdown 语法
      const isVideo = result.type.startsWith('video/');
      const markdownText = isVideo
        ? `<video src="${result.url}" controls></video>`
        : `![${result.filename}](${result.url})`;
      
      onChange(content + '\n' + markdownText);
    }
    setCurrentFile('');
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await handleFileUpload(file);
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          await handleFileUpload(file);
        }
      }
    }
  };

  return (
    <div className="relative w-full">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className="min-h-[300px] w-full rounded-lg border border-gray-300 p-4 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        placeholder="在这里输入内容..."
      />
      
      {uploading && currentFile && (
        <div className="absolute bottom-4 left-4 right-4">
          <UploadProgress progress={progress} fileName={currentFile} />
        </div>
      )}
      
      {error && (
        <div className="mt-2 text-sm text-red-500">
          上传失败: {error}
        </div>
      )}
    </div>
  );
}; 