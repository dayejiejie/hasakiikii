"use client";

import { useState, useEffect, useRef, Dispatch, SetStateAction, useCallback } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import OpenAI from 'openai';

export type ModelType = 'gpt-4o' | 'gpt-4o-all' | 'o1-pro' | 'o1-pro-all' | 'o1' | 'o1-all' | 'o1-mini' | 'o1-mini-all' | 'o1-preview' | 'o1-preview-all';
type VoiceType = 'alloy' | 'echo' | 'fable' | 'nova' | 'shimmer' | 'onyx';
type TTSModelType = 'tts-1' | 'tts-1-1106' | 'tts-1-hd' | 'tts-1-hd-1106';
type ImageModelType = 'dall-e-2' | 'dall-e-3';
type ImageSizeType = '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
type ImageQualityType = 'standard' | 'hd';
type ImageStyleType = 'vivid' | 'natural';
type ImageOperationType = 'generate' | 'edit' | 'variation';

// 添加 WebSocket 相关类型
type WebSocketMessage = {
  type: string;
  item?: {
    type: string;
    role: string;
    content: Array<{
      type: string;
      text?: string;
      audio?: string;
    }>;
  };
  text?: string;
};

interface Message {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  translation?: string;
}

interface Props {
  aiName: string;
  messages: Message[];
  loading: boolean;
  model: ModelType;
  setModel: React.Dispatch<React.SetStateAction<ModelType>>;
  bilingual: boolean;
  setBilingual: (bilingual: boolean) => void;
  onSendMessage: (message: string, image?: File, role?: 'user' | 'assistant', bilingual?: boolean, model?: ModelType) => Promise<void>;
  navigationItems: Array<{
    name: string;
    href: string;
    icon: React.ReactNode;
  }>;
  hideModelSelect?: boolean;
}

// 音频处理函数
const floatTo16BitPCM = (float32Array: Float32Array) => {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
};

const base64EncodeAudio = (float32Array: Float32Array) => {
  const arrayBuffer = floatTo16BitPCM(float32Array);
  let binary = '';
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
};

// 添加 ReactMarkdown 组件类型
interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// 创建 OpenAI 客户端
const client = new OpenAI({
  baseURL: process.env.NEXT_PUBLIC_OPENAI_API_URL || 'https://yunwu.ai/v1',
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

// 修改对话上下文类型
type ConversationMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// 添加类型定义
type ImageSize = "1024x1024" | "1024x1792" | "1792x1024";
type ImageQuality = "standard" | "hd";

const ChatInterface: React.FC<Props> = ({ 
  aiName, 
  messages: initialMessages,
  loading,
  model = 'gpt-4o-all', 
  setModel, 
  bilingual, 
  setBilingual, 
  onSendMessage, 
  navigationItems, 
  hideModelSelect 
}) => {
  // 使用内部状态管理消息
  const [localMessages, setLocalMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedVoice, setSelectedVoice] = useState<VoiceType>('nova');
  const [selectedModel, setSelectedModel] = useState<TTSModelType>('tts-1');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speed, setSpeed] = useState<number>(1.0);
  const [autoVoiceMode, setAutoVoiceMode] = useState(false);
  const recognitionRef = useRef<any>(null);
  const lastMessageRef = useRef<string | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const SILENCE_TIMEOUT = 5000; // 5秒无语音自动发送

  // 添加实时对话相关状态
  const [isRealtimeMode, setIsRealtimeMode] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const processorRef = useRef<AudioWorkletNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // 添加图片生成状态
  const [imageSize, setImageSize] = useState<ImageSize>("1024x1024");
  const [imageQuality, setImageQuality] = useState<ImageQuality>("standard");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    // 检查浏览器是否支持语音识别
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
    }
  }, []);

  // 修改自动滚动函数
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

  // 修改 useEffect
  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  // 添加剪贴板粘贴处理
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      Array.from(items).forEach(item => {
        if (item.type.startsWith('image')) {
          const file = item.getAsFile();
          if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
          }
        }
      });
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // 当外部消息更新时，同步到内部状态
  useEffect(() => {
    setLocalMessages(initialMessages);
  }, [initialMessages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSpeechError('请选择图片文件');
        setTimeout(() => setSpeechError(''), 3000);
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

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || loading) return;

    const message = input.trim();
    setInput('');

    try {
      // 创建消息内容数组
      const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];
      
      // 如果有文本消息，添加到内容数组
      if (message) {
        content.push({ type: 'text', text: message || "What's in this image?" });
      }
      
      // 如果有图片，转换为 base64 并添加到内容数组
      if (selectedImage) {
        const base64Image = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result as string;
            resolve(base64);
          };
          reader.readAsDataURL(selectedImage);
        });

        content.push({
          type: 'image_url',
          image_url: {
            url: base64Image
          }
        });
      }

      // 添加用户消息到界面
      const userMessage: Message = {
        role: 'user',
        content: content
      };
      setLocalMessages(prev => [...prev, userMessage]);

      // 清理图片 - 移到这里，在发送消息后立即清理
      handleImageRemove();

      // 发送请求到 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: `你是一个专业的多功能助手，可以处理各种类型的内容：

1. 对于图片内容：
- 仔细观察图片中的细节
- 用清晰、专业、准确的语言描述内容
- 如果看不清或无法识别某些内容，请诚实说明

2. 对于代码内容：
- 识别编程语言和框架
- 分析代码的功能和结构
- 指出关键的语法特性和设计模式
- 如果发现潜在问题，请提出建议

3. 对于文本内容：
- 理解用户的具体问题
- 提供准确、有针对性的回答
- 使用清晰的结构和分点说明

请根据输入内容的类型，自动切换到相应的分析模式。回答要分点并突出重点。`
            },
            {
              role: 'user',
              content: content
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API请求失败: ${response.status} ${response.statusText}`);
      }
      
      if (!data.reply) {
        throw new Error('API返回数据格式错误');
      }

      // 添加助手回复
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply
      };
      setLocalMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const errorResponse: Message = {
        role: 'assistant',
        content: '抱歉，发生了错误：' + errorMessage
      };
      setLocalMessages(prev => [...prev, errorResponse]);
      setSpeechError(errorMessage);
      setTimeout(() => setSpeechError(''), 5000);
    }
  };

  const startListening = () => {
    if (!speechSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'zh-CN';

    recognitionRef.current.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      setSpeechError(`语音识别错误: ${event.error}`);
      setTimeout(() => setSpeechError(''), 5000);
      setIsListening(false);
      if (autoVoiceMode) {
        setTimeout(startListening, 1000);
      }
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current.start();
      }
    };

    try {
      recognitionRef.current.start();
      setIsListening(true);
      setSpeechError('');
    } catch (error) {
      console.error('启动语音识别失败:', error);
      setSpeechError('启动语音识别失败');
      setTimeout(() => setSpeechError(''), 5000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // 处理消息内容，支持代码块和链接
  const processContent = (content: string) => {
    // 处理链接
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = content.split(linkRegex);
    
    if (parts.length === 1) return content;

    return parts.map((part, index) => {
      if (index % 3 === 1) {
        // 链接文本
        return <Link key={index} href={parts[index + 1]} className="text-blue-500 hover:underline">{part}</Link>;
      } else if (index % 3 === 0) {
        // 普通文本
        return part;
      }
      return null;
    });
  };

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
                      },
                      a({node, children, href, ...props}) {
                        return (
                          <Link href={href || ''} className="text-blue-500 hover:underline" {...props}>
                            {children}
                          </Link>
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
          {bilingual && role === 'assistant' && translation && (
            <div className="prose prose-sm max-w-none dark:prose-invert text-gray-500 border-t border-gray-200 mt-2 pt-2">
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
                  },
                  a({node, children, href, ...props}) {
                    return (
                      <Link href={href || ''} className="text-blue-500 hover:underline" {...props}>
                        {children}
                      </Link>
                    );
                  }
                }}
              >
                {translation}
              </ReactMarkdown>
            </div>
          )}
        </div>
      );
    }

    // 如果 content 是字符串
    return (
      <div className="space-y-2">
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
              },
              a({node, children, href, ...props}) {
                return (
                  <Link href={href || ''} className="text-blue-500 hover:underline" {...props}>
                    {children}
                  </Link>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        {bilingual && role === 'assistant' && translation && (
          <div className="prose prose-sm max-w-none dark:prose-invert text-gray-500 border-t border-gray-200 mt-2 pt-2">
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
                },
                a({node, children, href, ...props}) {
                  return (
                    <Link href={href || ''} className="text-blue-500 hover:underline" {...props}>
                      {children}
                    </Link>
                  );
                }
              }}
            >
              {translation}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  };

  // WebSocket 连接管理
  const connectWebSocket = useCallback(() => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws') || '');
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      // 发送初始化消息
      ws.send(JSON.stringify({
        type: 'conversation.create',
        model: 'gpt-4o-realtime-preview'
      }));
    };

    ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      if (message.type === 'conversation.item.message' && message.item?.content) {
        const content = message.item.content[0];
        if (content.type === 'text' && content.text) {
          setLocalMessages(prev => [...prev, {
            role: 'assistant',
            content: content.text as string
          } as Message]);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setSpeechError('WebSocket 连接错误');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnection(null);
      setIsRealtimeMode(false);
    };

    setWsConnection(ws);
  }, []);

  // 修改开始实时对话函数
  const startRealtimeChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);

      // 创建音频处理器
      await audioContextRef.current.audioWorklet.addModule('/audio-processor.js');
      processorRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      
      // 创建语音识别
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';

      let currentText = '';
      let isRecognitionActive = false;
      let conversationContext: ConversationMessage[] = [
        {
          role: 'system',
          content: `你是一个专业的对话助手，保持对话的连贯性和上下文理解。
                   1. 理解用户的语境和意图
                   2. 给出简洁、准确的回应
                   3. 记住之前的对话内容
                   4. 自然地延续话题
                   请用自然、友好的语气回应。`
        }
      ];

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        currentText = transcript;
      };

      recognition.onend = () => {
        isRecognitionActive = false;
      };

      processorRef.current.port.onmessage = async (event) => {
        if (event.data.type === 'speech_start') {
          // 开始说话，重置文本
          currentText = '';
          if (!isRecognitionActive) {
            try {
              await recognition.start();
              isRecognitionActive = true;
            } catch (error) {
              console.error('语音识别启动失败:', error);
            }
          }
        } else if (event.data.type === 'speech_end') {
          // 停止说话，停止识别并发送累积的文本
          if (isRecognitionActive) {
            recognition.stop();
          }
          
          if (currentText.trim()) {
            try {
              // 添加用户消息到上下文
              conversationContext.push({
                role: 'user',
                content: currentText.trim()
              });

              // 添加用户消息到界面
              setLocalMessages(prev => [
                ...prev,
                {
                  role: 'user',
                  content: currentText.trim()
                } as Message
              ]);

              // 创建 AI 响应
              const response = await client.chat.completions.create({
                model: 'gpt-4o-all',
                messages: conversationContext as any,
                stream: true,
                temperature: 0.7,
                presence_penalty: 0.6,
                frequency_penalty: 0.5
              });

              let accumulatedResponse = '';

              // 处理流式响应
              for await (const chunk of response) {
                if (chunk.choices[0]?.delta?.content) {
                  accumulatedResponse += chunk.choices[0].delta.content;
                  
                  setLocalMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage?.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        {
                          ...lastMessage,
                          content: accumulatedResponse
                        }
                      ];
                    } else {
                      return [
                        ...prev,
                        {
                          role: 'assistant',
                          content: accumulatedResponse
                        } as Message
                      ];
                    }
                  });
                }
              }

              // 添加 AI 响应到上下文
              conversationContext.push({
                role: 'assistant',
                content: accumulatedResponse
              });

              // 限制上下文长度，保留最近的对话
              if (conversationContext.length > 10) {
                conversationContext = [
                  conversationContext[0], // 保留系统提示
                  ...conversationContext.slice(-8) // 保留最近的4轮对话
                ];
              }

              // 准备接收新的语音输入
              currentText = '';
            } catch (error) {
              console.error('发送消息失败:', error);
              setSpeechError('发送消息失败');
            }
          }
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      setIsRealtimeMode(true);
      recognitionRef.current = recognition;
    } catch (error) {
      console.error('启动实时对话失败:', error);
      setSpeechError('启动实时对话失败');
    }
  };

  // 修改停止实时对话函数
  const stopRealtimeChat = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsRealtimeMode(false);
  };

  // 清理函数
  useEffect(() => {
    return () => {
      stopRealtimeChat();
    };
  }, []);

  // 添加图片生成函数
  const handleGenerateImage = async () => {
    if (!input.trim() || isGeneratingImage) return;
    
    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input,
          size: imageSize,
          quality: imageQuality,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 添加生成的图片到消息列表
        setLocalMessages(prev => [...prev, {
          role: 'user',
          content: `![Generated Image](${data.imageUrl})`,
          translation: `![Generated Image](${data.imageUrl})`
        } as Message]);
        setInput('');
      } else {
        throw new Error(data.error || '图片生成失败');
      }
    } catch (error: any) {
      console.error('Error generating image:', error);
      setLocalMessages(prev => [...prev, {
        role: 'assistant',
        content: '图片生成失败: ' + error.message,
        translation: '图片生成失败: ' + error.message
      } as Message]);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="text-xl font-semibold text-gray-800">{aiName}</div>
          {!hideModelSelect && (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelType)}
              className="px-3 py-1 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition-all duration-200"
            >
              <option value="gpt-4o-all">GPT-4O</option>
              <option value="o1-pro-all">O1-Pro</option>
              <option value="o1-all">O1</option>
              <option value="o1-mini-all">O1-Mini</option>
              <option value="o1-preview-all">O1-Preview</option>
            </select>
          )}
          <button
            onClick={() => setBilingual(!bilingual)}
            className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
              bilingual
                ? 'bg-blue-500 text-white'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-400'
            }`}
          >
            双语模式
          </button>
          
          {/* 添加图片生成选项 */}
          <select
            value={imageSize}
            onChange={(e) => setImageSize(e.target.value as ImageSize)}
            className="px-3 py-1 text-sm rounded-lg border border-gray-200 bg-white"
          >
            <option value="1024x1024">1024x1024</option>
            <option value="1024x1792">1024x1792</option>
            <option value="1792x1024">1792x1024</option>
          </select>
          
          <select
            value={imageQuality}
            onChange={(e) => setImageQuality(e.target.value as ImageQuality)}
            className="px-3 py-1 text-sm rounded-lg border border-gray-200 bg-white"
          >
            <option value="standard">标准质量</option>
            <option value="hd">高清质量</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          {navigationItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              {item.icon}
            </Link>
          ))}
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {localMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}
                >
                  <MessageContent 
                    content={message.content} 
                    translation={message.translation} 
                    role={message.role}
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-2xl bg-gray-50 text-gray-700 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-px" />
          </div>

          {/* 输入区域 */}
          <div className="p-4 border-t border-gray-100 bg-white">
            {speechError && (
              <div className="mb-4 px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {speechError}
              </div>
            )}
            {imagePreview && (
              <div className="mb-4 relative inline-block group">
                <img src={imagePreview} alt="Selected" className="max-h-32 rounded-lg" />
                <button
                  onClick={handleImageRemove}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs py-1 px-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  支持剪贴板粘贴图片
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder={isRealtimeMode ? '实时对话模式...' : isListening ? '正在听您说...' : selectedImage ? '请描述这张图片...' : '输入您的问题...'}
                disabled={loading || isRealtimeMode}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !input.trim()}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isGeneratingImage || !input.trim()
                      ? 'text-gray-400 bg-gray-100'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-400'
                  }`}
                  title="生成图片"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                  id="image-upload"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="p-3 rounded-xl transition-all duration-200 bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-400 group relative"
                  title="上传图片"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    点击上传或粘贴图片
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (isRealtimeMode) {
                      stopRealtimeChat();
                    } else {
                      startRealtimeChat();
                    }
                  }}
                  disabled={loading}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    isRealtimeMode
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-blue-400'
                  }`}
                  title={isRealtimeMode ? '结束实时对话' : '开始实时对话'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                </button>
                {speechSupported && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isListening) {
                        stopListening();
                      } else {
                        startListening();
                      }
                    }}
                    disabled={loading}
                    className={`p-3 rounded-xl transition-all duration-200 flex items-center justify-center ${
                      isListening
                        ? 'bg-red-500 text-white'
                        : loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                    title={isListening ? '点击停止录音' : '点击开始语音输入'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                <button
                  type="submit"
                  disabled={(!input.trim() && !selectedImage) || loading}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                    (!input.trim() && !selectedImage) || loading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  发送
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 