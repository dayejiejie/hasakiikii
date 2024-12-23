import { useState } from 'react';

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
  success: boolean;
}

interface UploadResult {
  id: string;
  filename: string;
  url: string;
  type: string;
}

export const useFileUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    progress: 0,
    uploading: false,
    error: null,
    success: false
  });

  const uploadFile = async (file: File): Promise<UploadResult | null> => {
    setUploadState({
      progress: 0,
      uploading: true,
      error: null,
      success: false
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      // 设置进度监听
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadState(prev => ({
            ...prev,
            progress
          }));
        }
      };

      // 创建 Promise 来处理上传结果
      const response = await new Promise<UploadResult>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.success) {
              resolve(response.file);
            } else {
              reject(new Error(response.error || '上传失败'));
            }
          } else {
            reject(new Error('上传失败'));
          }
        };

        xhr.onerror = () => {
          reject(new Error('网络错误'));
        };

        // 发送请求
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });

      setUploadState({
        progress: 100,
        uploading: false,
        error: null,
        success: true
      });

      return response;
    } catch (error) {
      setUploadState({
        progress: 0,
        uploading: false,
        error: error instanceof Error ? error.message : '上传失败',
        success: false
      });
      return null;
    }
  };

  return {
    uploadFile,
    ...uploadState
  };
}; 