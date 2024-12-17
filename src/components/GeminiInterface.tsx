'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// 添加类型定义
interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

interface Message {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  translation?: string;
}

interface Props {
  aiName: string;
  messages: Message[];
  loading: boolean;
  onSendMessage: (message: string, image?: File) => Promise<void>;
  bilingual: boolean;
  setBilingual: (bilingual: boolean) => void;
  navigationItems: Array<{
    name: string;
    href: string;
    icon: React.ReactNode;
  }>;
}

// 添加视频捕捉类型
type CaptureMode = 'camera' | 'screen' | 'region';

// 消息显示组件
const MessageContent = ({ content, translation, role }: { 
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>, 
  translation?: string, 
  role: 'user' | 'assistant' 
}) => {
  // 如果 content 是数组（复合内容）
  if (Array.isArray(content)) {
    return (
      <div className="space-y-2">
        {content.map((item, index) => {
          if (item.type === 'text' && item.text) {
            return (
              <div key={index} className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={{
                    code({node, inline, className, children, ...props}: CodeProps) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {item.text}
                </ReactMarkdown>
              </div>
            );
          } else if (item.type === 'image_url' && item.image_url) {
            return (
              <div key={index} className="mt-2">
                <img 
                  src={item.image_url.url} 
                  alt="Uploaded content" 
                  className="max-h-48 rounded-lg"
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  // 如果 content 是字符串
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          code({node, inline, className, children, ...props}: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded" {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const GeminiInterface: React.FC<Props> = ({
  aiName,
  messages,
  loading,
  onSendMessage,
  bilingual,
  setBilingual,
  navigationItems,
}) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showCaptureOptions, setShowCaptureOptions] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const messageContainer = messagesEndRef.current.parentElement;
      if (messageContainer) {
        messageContainer.scrollTo({
          top: messageContainer.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理图片移除
  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理消息发送
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 如果正在录制或捕捉视频，不处理提交
    if ((!input.trim() && !selectedImage) || loading || isRecording || isCapturing) return;

    const message = input.trim();
    setInput('');
    await onSendMessage(message, selectedImage || undefined);
    handleImageRemove();
  };

  // 处理粘贴事件
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.startsWith('image')) {
          const file = item.getAsFile();
          if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // 开始摄像头捕捉
  const startCameraCapture = async () => {
    try {
      console.log('开始请求摄像头权限');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持摄像头访问');
      }

      // 先设置状态，确保视频界面被渲染
      setIsCapturing(true);
      setCaptureMode('camera');
      setShowCaptureOptions(false);
      
      // 等待视频元素挂载
      await new Promise<void>((resolve) => {
        const checkVideoElement = () => {
          if (videoRef.current) {
            resolve();
          } else {
            console.log('等待视频元素挂载...');
            setTimeout(checkVideoElement, 100);
          }
        };
        checkVideoElement();
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('获取到摄像头流', {
        tracks: stream.getTracks().map(t => ({
          kind: t.kind,
          label: t.label,
          enabled: t.enabled,
          state: t.readyState
        }))
      });

      if (videoRef.current) {
        console.log('设置视频源');
        videoRef.current.srcObject = stream;
        
        // 添加视频事件监听
        videoRef.current.onloadedmetadata = () => {
          console.log('视频元数据已加载');
          if (videoRef.current) {
            console.log('开始播放视频');
            videoRef.current.play()
              .then(() => {
                console.log('视频开始播放成功');
              })
              .catch(e => {
                console.error('视频播放失败:', e);
              });
          }
        };

        videoRef.current.onplay = () => {
          console.log('视频播放事件触发');
        };

        videoRef.current.onplaying = () => {
          console.log('视频正在播放');
        };

        videoRef.current.onerror = (e) => {
          console.error('视频错误:', e);
        };

        streamRef.current = stream;
      } else {
        throw new Error('视频元素未找到');
      }
    } catch (error) {
      console.error('摄像头访问失败:', error);
      setIsCapturing(false);
      setCaptureMode(null);
      alert('无法访问摄像头: ' + (error instanceof Error ? error.message : '未知错误'));
      
      // 清理资源
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // 开始屏幕录制
  const startScreenCapture = async () => {
    try {
      console.log('开始请求屏幕录制权限');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('您的浏览器不支持屏幕录制');
      }

      // 先设置状态，确保视频界面被渲染
      setIsCapturing(true);
      setCaptureMode('screen');
      setShowCaptureOptions(false);
      
      // 等待视频元素挂载
      await new Promise<void>((resolve) => {
        const checkVideoElement = () => {
          if (videoRef.current) {
            resolve();
          } else {
            console.log('等待视频元素挂载...');
            setTimeout(checkVideoElement, 100);
          }
        };
        checkVideoElement();
      });

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      console.log('获取到屏幕流', {
        tracks: stream.getTracks().map(t => ({
          kind: t.kind,
          label: t.label,
          enabled: t.enabled,
          state: t.readyState
        }))
      });

      if (videoRef.current) {
        console.log('设置视频源');
        videoRef.current.srcObject = stream;
        
        // 添加视频事件监听
        videoRef.current.onloadedmetadata = () => {
          console.log('视频元数据已加载');
          if (videoRef.current) {
            console.log('开始播放视频');
            videoRef.current.play()
              .then(() => {
                console.log('视频开始播放成功');
              })
              .catch(e => {
                console.error('视频播放失败:', e);
              });
          }
        };

        videoRef.current.onplay = () => {
          console.log('视频播放事件触发');
        };

        videoRef.current.onplaying = () => {
          console.log('视频正在播放');
        };

        videoRef.current.onerror = (e) => {
          console.error('视频错误:', e);
        };

        // 监听屏幕共享结束事件
        stream.getVideoTracks()[0].onended = () => {
          console.log('屏幕共享已结束');
          stopCapture();
        };

        streamRef.current = stream;
      } else {
        throw new Error('视频元素未找到');
      }
    } catch (error) {
      console.error('屏幕录制失败:', error);
      setIsCapturing(false);
      setCaptureMode(null);
      alert('无法录制屏幕: ' + (error instanceof Error ? error.message : '未知错误'));
      
      // 清理资源
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  // 停止捕捉
  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('停止轨道:', track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setCaptureMode(null);
  };

  // 拍摄照片
  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 设置画布大小为视频的实际大小
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 在画布上绘制当前视频帧
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 如果是摄像头模式，需要水平翻转图像
    if (captureMode === 'camera') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 将画布内容转换为文件
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `snapshot-${Date.now()}.png`, { type: 'image/png' });
        setSelectedImage(file);
        setImagePreview(canvas.toDataURL('image/png'));
        stopCapture();
      }
    }, 'image/png');
  };

  // 开始录制
  const startRecording = () => {
    if (!streamRef.current) return;
    
    try {
      console.log('初始化 MediaRecorder');
      
      // 使用最基本的配置
      const mediaRecorder = new MediaRecorder(streamRef.current);
      const chunks: Blob[] = [];
      
      // 数据可用时的处理
      mediaRecorder.ondataavailable = (e) => {
        console.log('收到数据块:', e.data?.size || 0, 'bytes');
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      // 录制停止时的处理
      mediaRecorder.onstop = () => {
        console.log('录制停止，数据块数量:', chunks.length);
        
        if (chunks.length === 0) {
          console.error('没有录制到视频数据');
          onSendMessage('视频分析失败: 没有录制到视频数据');
          return;
        }

        const blob = new Blob(chunks, { type: 'video/webm' });
        console.log('生成视频文件，大小:', blob.size, 'bytes');
        
        if (blob.size === 0) {
          console.error('视频文件为空');
          onSendMessage('视频分析失败: 视频文件为空');
          return;
        }

        const file = new File([blob], `recording-${Date.now()}.webm`, { type: 'video/webm' });
        analyzeVideo(file);
      };
      
      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      setIsRecording(true);
      
      // 开始录制，每秒获取一次数据
      mediaRecorder.start(1000);
      console.log('开始录制视频');
      
    } catch (error) {
      console.error('初始化录制器失败:', error);
      alert('无法初始化视频录制: ' + (error instanceof Error ? error.message : '未知错误'));
      setIsRecording(false);
    }
  };

  // 停止录制
  const stopRecording = () => {
    console.log('准备停止录制');
    if (!mediaRecorderRef.current) {
      console.error('MediaRecorder 未初始化');
      return;
    }
    
    try {
      // 请求当前数据
      mediaRecorderRef.current.requestData();
      
      // 停止录制
      mediaRecorderRef.current.stop();
      console.log('已调用 stop()');
      
      setIsRecording(false);
    } catch (error) {
      console.error('停止录制失败:', error);
      setIsRecording(false);
    }
  };

  // 分析视频
  const analyzeVideo = async (videoFile: File) => {
    try {
      setAnalysisResult(null);
      setInput('');
      
      console.log('开始分析视频:', {
        name: videoFile.name,
        type: videoFile.type,
        size: videoFile.size
      });

      // 创建 FormData
      const formData = new FormData();
      formData.append('video', videoFile);  // 发送完整视频文件
      formData.append('mode', captureMode || 'screen');
      
      // 发送请求
      const response = await fetch('/api/gemini/video', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '视频分析请求失败');
      }
      
      if (data.reply) {
        setAnalysisResult(`[${captureMode === 'camera' ? '摄像头' : '屏幕录制'}分析结果]\n\n${data.reply}`);
      }

    } catch (error) {
      console.error('视频分析错误:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setAnalysisResult(`视频分析失败: ${errorMessage}`);
    } finally {
      setIsRecording(false);
      setRecordedChunks([]);
      stopCapture();
    }
  };

  // 修改渲染视频捕捉界面
  const renderCaptureInterface = () => {
    if (!isCapturing) return null;
    
    console.log('渲染视频捕捉界面', {
      captureMode,
      hasVideoRef: !!videoRef.current,
      hasStream: !!streamRef.current,
      isRecording
    });
    
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-4xl w-full">
          <div className="relative">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
                style={{ 
                  transform: captureMode === 'camera' ? 'scaleX(-1)' : 'none',
                  backgroundColor: 'black'
                }}
              />
              {!videoRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  正在加载{captureMode === 'camera' ? '摄像头' : '屏幕共享'}...
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition-colors flex items-center space-x-2"
                >
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span>停止录制</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={startRecording}
                    className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
                  >
                    开始录制
                  </button>
                  <button
                    onClick={takeSnapshot}
                    className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors"
                  >
                    拍摄照片
                  </button>
                </>
              )}
              <button
                onClick={stopCapture}
                className="bg-gray-500 text-white px-4 py-2 rounded-full hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染捕捉选项
  const renderCaptureOptions = () => {
    if (!showCaptureOptions) return null;
    
    return (
      <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
        <div className="flex flex-col space-y-2">
          <button
            onClick={() => {
              setShowCaptureOptions(false);
              startCameraCapture();
            }}
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            <span>摄像头</span>
          </button>
          <button
            onClick={() => {
              setShowCaptureOptions(false);
              startScreenCapture();
            }}
            className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
            </svg>
            <span>屏幕录制</span>
          </button>
        </div>
      </div>
    );
  };

  // 生成音乐
  const generateMusic = async () => {
    if (!input.trim() || isGeneratingMusic) return;

    try {
      setIsGeneratingMusic(true);
      const response = await fetch('/api/suno', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input.trim()
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '音乐生成失败');
      }

      if (data.audioUrl) {
        setAudioUrl(data.audioUrl);
        await onSendMessage('[音乐生成]');
        await onSendMessage(`已生成音乐，可以点击播放：\n\n[点击播放音乐](${data.audioUrl})`);
      }
    } catch (error) {
      console.error('音乐生成错误:', error);
      await onSendMessage('音乐生成失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  // 清理函数
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  // 渲染分析结果
  const renderAnalysisResult = () => {
    if (!analysisResult) return null;
    
    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-4xl w-full">
          <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeRaw, rehypeKatex]}
            >
              {analysisResult}
            </ReactMarkdown>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setAnalysisResult(null)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              关闭
            </button>
            <button
              onClick={async () => {
                await onSendMessage(analysisResult);
                setAnalysisResult(null);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              发送到对话
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* 导航栏 - 添加移动端响应式布局 */}
      <nav className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 py-2 px-3 sm:py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white whitespace-nowrap"
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setBilingual(!bilingual)}
              className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                bilingual
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              双语模式 {bilingual ? '开' : '关'}
            </button>
          </div>
        </div>
      </nav>

      {/* 消息列表 - 优化移动端显示 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-3xl rounded-lg p-3 sm:p-4 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <MessageContent {...message} />
              {message.translation && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    {message.translation}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 - 优化移动端布局 */}
      <div className="border-t dark:border-gray-700 p-2 sm:p-4">
        <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-4">
          {/* 图片预览 */}
          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-24 sm:max-h-32 rounded-lg"
              />
              <button
                type="button"
                onClick={handleImageRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3 sm:h-4 sm:w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="flex space-x-2 sm:space-x-4">
            {/* 图片上传按钮 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCaptureOptions(!showCaptureOptions)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <div className={`absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 ${
                showCaptureOptions ? 'block' : 'hidden'
              } z-50`}>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => {
                      setShowCaptureOptions(false);
                      startCameraCapture();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <span>摄像头</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCaptureOptions(false);
                      startScreenCapture();
                    }}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm whitespace-nowrap"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                    </svg>
                    <span>屏幕录制</span>
                  </button>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* 文本输入框 */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`发送消息给 ${aiName}...`}
              className="flex-1 rounded-lg border dark:border-gray-700 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm sm:text-base"
              disabled={loading || isRecording || isCapturing}
            />

            {/* 发送按钮 */}
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || loading || isRecording || isCapturing}
              className={`px-4 sm:px-6 py-2 rounded-lg ${
                loading || (!input.trim() && !selectedImage) || isRecording || isCapturing
                  ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
              } text-white font-medium text-sm sm:text-base whitespace-nowrap`}
            >
              {loading ? '发送中...' : '发送'}
            </button>
          </div>
        </form>
      </div>

      {/* 视频捕捉界面 - 优化移动端显示 */}
      {isCapturing && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-lg w-full max-w-4xl">
            <div className="relative">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                  style={{ 
                    transform: captureMode === 'camera' ? 'scaleX(-1)' : 'none',
                    backgroundColor: 'black'
                  }}
                />
                {!videoRef.current?.srcObject && (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-sm sm:text-base">
                    正在加载{captureMode === 'camera' ? '摄像头' : '屏幕共享'}...
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-wrap justify-center gap-2 sm:gap-4 px-2">
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-full hover:bg-red-600 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                  >
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                    <span>停止录制</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={startRecording}
                      className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-full hover:bg-blue-600 transition-colors text-sm sm:text-base"
                    >
                      开始录制
                    </button>
                    <button
                      onClick={takeSnapshot}
                      className="bg-green-500 text-white px-3 sm:px-4 py-2 rounded-full hover:bg-green-600 transition-colors text-sm sm:text-base"
                    >
                      拍摄照片
                    </button>
                  </>
                )}
                <button
                  onClick={stopCapture}
                  className="bg-gray-500 text-white px-3 sm:px-4 py-2 rounded-full hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 分析结果弹窗 - 优化移动端显示 */}
      {analysisResult && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-lg w-full max-w-4xl">
            <div className="prose prose-sm max-w-none dark:prose-invert mb-3 sm:mb-4 text-sm sm:text-base overflow-y-auto max-h-[60vh] sm:max-h-[70vh]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeRaw, rehypeKatex]}
              >
                {analysisResult}
              </ReactMarkdown>
            </div>
            <div className="flex justify-end space-x-2 sm:space-x-4">
              <button
                onClick={() => setAnalysisResult(null)}
                className="px-3 sm:px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm sm:text-base"
              >
                关闭
              </button>
              <button
                onClick={async () => {
                  await onSendMessage(analysisResult);
                  setAnalysisResult(null);
                }}
                className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm sm:text-base"
              >
                发送到对话
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeminiInterface; 