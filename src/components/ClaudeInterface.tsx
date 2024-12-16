import { useState, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

interface Message {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
  translation?: string;
}

interface Props {
  messages: Message[];
  loading: boolean;
  onSendMessage: (message: string, image?: File) => Promise<void>;
  bilingual: boolean;
  setBilingual: (value: boolean) => void;
  navigationItems: Array<{
    name: string;
    href: string;
    icon: React.ReactNode;
  }>;
}

// 添加类型定义
interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

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

const ClaudeInterface: React.FC<Props> = ({
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || loading) return;

    const message = input.trim();
    setInput('');

    try {
      await onSendMessage(message, selectedImage || undefined);
      handleImageRemove();
      scrollToBottom();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        console.error('请选择图片文件');
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

  // 添加剪贴板粘贴处理
  const handlePaste = async (e: React.ClipboardEvent) => {
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

  return (
    <div className="flex flex-col h-screen bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* 顶部导航栏 */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="text-xl font-semibold text-gray-800">Claude</div>
          <button
            onClick={() => setBilingual(!bilingual)}
            className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
              bilingual
                ? 'bg-purple-500 text-white'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-purple-400'
            }`}
          >
            双语模式
          </button>
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
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                    message.role === 'user'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-50 text-gray-700 border border-gray-100'
                  }`}
                >
                  <MessageContent 
                    content={message.content} 
                    translation={message.translation} 
                    role={message.role}
                  />
                  {bilingual && message.role === 'assistant' && message.translation && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-gray-500">
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
                        {message.translation}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-4 rounded-2xl bg-gray-50 text-gray-700 border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-px" />
          </div>

          {/* 输入区域 */}
          <div className="p-4 border-t border-gray-100 bg-white">
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
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onPaste={handlePaste}
                className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder={loading ? '正在处理...' : selectedImage ? '请描述这张图片...' : '输入您的问题...'}
                disabled={loading}
              />
              <div className="flex gap-2">
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
                  className="p-3 rounded-xl transition-all duration-200 bg-gray-50 text-gray-700 border border-gray-200 hover:border-purple-400 group relative"
                  title="上传图片"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={(!input.trim() && !selectedImage) || loading}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                    (!input.trim() && !selectedImage) || loading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
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

export default ClaudeInterface; 