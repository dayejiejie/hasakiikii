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

// 添加 CustomLink 组件
interface CustomLinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

const CustomLink: React.FC<CustomLinkProps> = ({ href, className, children }) => (
  <Link href={href} className={className}>
    {children}
  </Link>
);

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
              <div key={index} className="prose prose-sm sm:prose-base max-w-none dark:prose-invert break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeRaw, rehypeKatex]}
                  components={{
                    code({node, inline, className, children, ...props}: CodeProps) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <pre className="bg-gray-800 text-gray-100 p-2 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      ) : (
                        <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs sm:text-sm" {...props}>
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
                  className="max-h-36 sm:max-h-48 rounded-lg object-contain"
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
    <div className="space-y-2">
      <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeRaw, rehypeKatex]}
          components={{
            code({node, inline, className, children, ...props}: CodeProps) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <pre className="bg-gray-800 text-gray-100 p-2 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              ) : (
                <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs sm:text-sm" {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
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
    <div className="flex flex-col h-[100dvh] bg-white rounded-lg shadow-xl overflow-hidden">
      {/* 顶部导航栏 - 优化移动端显示 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-6 py-2 sm:py-4 bg-white border-b border-gray-100 space-y-2 sm:space-y-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="text-lg sm:text-xl font-semibold text-gray-800">Claude</div>
          <button
            onClick={() => setBilingual(!bilingual)}
            className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-lg transition-all duration-200 ${
              bilingual
                ? 'bg-purple-500 text-white'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-purple-400'
            }`}
          >
            双语模式
          </button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {navigationItems.map((item, index) => (
            <CustomLink
              key={index}
              href={item.href}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 whitespace-nowrap"
            >
              {item.icon}
            </CustomLink>
          ))}
        </div>
      </div>

      {/* 消息列表 - 优化移动端显示 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-6">
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
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-50 text-gray-700 border border-gray-100'
              }`}
            >
              <MessageContent {...message} />
              {message.translation && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {message.translation}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] sm:max-w-[75%] p-3 sm:p-4 rounded-2xl bg-gray-50 text-gray-700 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-px" />
      </div>

      {/* 输入区域 - 优化移动端显示 */}
      <div className="p-2 sm:p-4 border-t border-gray-100 bg-white">
        {imagePreview && (
          <div className="mb-2 sm:mb-4 relative inline-block">
            <img src={imagePreview} alt="Selected" className="max-h-24 sm:max-h-32 rounded-lg object-contain" />
            <button
              onClick={handleImageRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
              placeholder={loading ? '正在处理...' : selectedImage ? '请描述这张图片...' : '输入您的问题...'}
              disabled={loading}
            />
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-2">
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
              disabled={loading}
              className="p-2 sm:p-3 rounded-xl transition-all duration-200 bg-gray-50 text-gray-700 border border-gray-200 hover:border-purple-400"
              title="上传图片"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              type="submit"
              disabled={(!input.trim() && !selectedImage) || loading}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-xl transition-all duration-200 ${
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
  );
};

export default ClaudeInterface; 