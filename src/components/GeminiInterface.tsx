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
    if ((!input.trim() && !selectedImage) || loading) return;

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
      
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持摄像头访问');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      console.log('获取到摄像头流:', stream.getVideoTracks()[0].label);

      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        console.log('视频录制完成，大小:', videoBlob.size);
        await analyzeVideo(videoBlob);
      };

      // 开始录制
      mediaRecorder.start();
      console.log('开始录制视频');

      // 保存引用以便后续清理
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      setIsCapturing(true);

      // 显示预览
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 设置自动停止录制（例如30秒后）
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          console.log('自动停止录制');
        }
      }, 30000); // 30秒后停止

    } catch (error) {
      console.error('摄像头访问错误:', error);
      alert('无法访问摄像头: ' + (error instanceof Error ? error.message : '未知错误'));
      stopCapture();
    }
  };

  // 开始屏幕捕捉
  const startScreenCapture = async () => {
    try {
      console.log('开始请求屏幕共享权限');
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } as MediaTrackConstraints,
        audio: false
      });
      
      console.log('获取到屏幕流:', stream.getVideoTracks()[0].label);

      // 创建 MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        console.log('视频录制完成，大小:', videoBlob.size);
        await analyzeVideo(videoBlob);
      };

      // 开始录制
      mediaRecorder.start();
      console.log('开始录制视频');

      // 保存引用以便后续清理
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = stream;
      setIsCapturing(true);

      // 显示预览
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // 监听流结束事件
      stream.getVideoTracks()[0].onended = () => {
        console.log('屏幕共享已结束');
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
        stopCapture();
      };

    } catch (error) {
      console.error('屏幕捕捉错误:', error);
      alert('无法捕捉屏幕: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 停止捕捉
  const stopCapture = () => {
    console.log('开始停止捕捉');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      console.log('停止录制');
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('停止视频轨道:', track.label);
      });
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
    setCaptureMode(null);
    setShowCaptureOptions(false);
    console.log('捕捉已完全停止');
  };

  // 分析视频
  const analyzeVideo = async (videoBlob: Blob) => {
    try {
      console.log('开始分析视频');
      
      // 将视频转换为 base64
      const base64Video = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]); // 移除 "data:video/webm;base64," 前缀
        };
        reader.readAsDataURL(videoBlob);
      });

      // 构建请求消息
      const messages = [
        {
          role: 'user',
          content: captureMode === 'camera' 
            ? '这是一段摄像头录制的视频，请分析视频中的内容并给出详细描述。'
            : '这是一段屏幕录制的视频，请分析视频中的内容并给出详细描述。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'video_url',
              video_url: {
                url: `data:video/webm;base64,${base64Video}`
              }
            }
          ]
        }
      ];

      const response = await fetch('/api/gemini/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          mode: captureMode
        }),
      });

      console.log('收到服务器响应:', response.status);
      const data = await response.json();
      console.log('解析的响应数据:', data);

      if (!response.ok) {
        throw new Error(data.error || '视频分析失败');
      }

      if (data.reply) {
        // 使用 onSendMessage 发送消息
        const message = captureMode === 'camera' ? '[摄像头视频分析]' : '[屏幕录制分析]';
        await onSendMessage(message);
        await onSendMessage(data.reply);
      }
    } catch (error) {
      console.error('视频分析错误:', error);
      await onSendMessage('视频分析失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 处理捕捉选项
  const handleCaptureOption = async (mode: CaptureMode) => {
    setCaptureMode(mode);
    if (mode === 'camera') {
      await startCameraCapture();
    } else if (mode === 'screen') {
      await startScreenCapture();
    }
  };

  // 清理函数
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  // 在 useEffect 中添加视频元素状态监控
  useEffect(() => {
    if (videoRef.current && isCapturing) {
      const video = videoRef.current;
      
      const checkVideoState = () => {
        console.log('视频状态:', {
          readyState: video.readyState,
          paused: video.paused,
          currentTime: video.currentTime,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          srcObject: video.srcObject ? '已设置' : '未设置'
        });
      };

      const interval = setInterval(checkVideoState, 1000);
      return () => clearInterval(interval);
    }
  }, [isCapturing]);

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

  return (
    <div className="flex flex-col h-[100dvh] bg-white rounded-lg shadow-xl overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-lg sm:text-xl font-semibold text-gray-800">{aiName}</div>
          <button
            onClick={() => setBilingual(!bilingual)}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-all duration-200 ${
              bilingual
                ? 'bg-green-500 text-white'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-green-400'
            }`}
          >
            双语模式
          </button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              {item.icon}
            </Link>
          ))}
        </div>
      </div>

      {/* 视频预览 */}
      {isCapturing && (
        <div className="relative bg-black p-3 sm:p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative w-full h-[240px] sm:h-[360px] bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-contain"
                autoPlay
                playsInline
                muted
                style={{ transform: 'none' }}
              />
              {!videoRef.current?.srcObject && (
                <div className="absolute inset-0 flex items-center justify-center text-white">
                  正在加载视频流...
                </div>
              )}
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={stopCapture}
                className="bg-red-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-600 flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                停止捕捉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 聊天区域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 no-scrollbar">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}
                >
                  <MessageContent content={message.content} translation={message.translation} role={message.role} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl bg-gray-50 text-gray-700 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-px" />
          </div>

          {/* 输入区域 */}
          <div className="border-t border-gray-100 p-3 sm:p-4">
            <div className="max-w-4xl mx-auto">
              {imagePreview && (
                <div className="mb-3 sm:mb-4 relative inline-block">
                  <img src={imagePreview} alt="Selected" className="max-h-24 sm:max-h-32 rounded-lg" />
                  <button
                    onClick={handleImageRemove}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
              {audioUrl && (
                <div className="mb-3 sm:mb-4">
                  <audio ref={audioRef} src={audioUrl} controls className="w-full" />
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={selectedImage ? '请描述这张图片...' : '输入您的问题...'}
                  className="flex-1 p-2 sm:p-3 rounded-xl border border-gray-200 focus:border-green-400 focus:ring focus:ring-green-100 transition-all duration-200 text-sm sm:text-base"
                />
                
                {/* 音乐生成按钮 */}
                <button
                  type="button"
                  onClick={generateMusic}
                  disabled={!input.trim() || isGeneratingMusic}
                  className={`p-2 sm:p-3 rounded-xl transition-all duration-200 ${
                    !input.trim() || isGeneratingMusic
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                  title="生成音乐"
                >
                  {isGeneratingMusic ? (
                    <div className="animate-spin h-4 sm:h-5 w-4 sm:w-5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </div>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  )}
                </button>

                {/* 视频捕捉按钮和选项 */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCaptureOptions(!showCaptureOptions)}
                    className="p-2 sm:p-3 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 hover:border-green-400 transition-all duration-200"
                    title="视频捕捉"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553 1.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  </button>
                  
                  {/* 捕捉选项弹出菜单 */}
                  {showCaptureOptions && !isCapturing && (
                    <div className="absolute bottom-full mb-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-1 sm:py-2 min-w-[120px] sm:min-w-[160px] z-50">
                      <button
                        type="button"
                        onClick={() => handleCaptureOption('camera')}
                        className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left hover:bg-gray-50 text-xs sm:text-sm"
                      >
                        摄像头捕捉
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCaptureOption('screen')}
                        className="w-full px-3 sm:px-4 py-1.5 sm:py-2 text-left hover:bg-gray-50 text-xs sm:text-sm"
                      >
                        屏幕捕捉
                      </button>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 sm:p-3 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 hover:border-green-400 transition-all duration-200"
                  title="上传图片"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 sm:h-5 w-4 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={(!input.trim() && !selectedImage) || loading}
                  className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 ${
                    (!input.trim() && !selectedImage) || loading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  发送
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiInterface; 