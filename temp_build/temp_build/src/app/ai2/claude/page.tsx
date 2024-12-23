'use client';
import { useState } from 'react';
import ClaudeInterface from '@/components/ClaudeInterface';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [bilingual, setBilingual] = useState(false);

  const sendMessage = async (message: string, image?: File) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('message', message);
      formData.append('bilingual', String(bilingual));
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch('/api/claude', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }));
        throw new Error(errorData.error || `API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages(prev => [...prev, 
        { 
          role: 'user', 
          content: image ? `[图片] ${message || ''}` : message 
        },
        { 
          role: 'assistant', 
          content: bilingual ? data.reply.split('---')[0].trim() : data.reply,
          translation: bilingual ? data.reply.split('---')[1]?.trim() : undefined
        }
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev,
        { 
          role: 'user', 
          content: image ? `[图片] ${message || ''}` : message 
        },
        { role: 'assistant', content: '抱歉，发生了错误：' + (error instanceof Error ? error.message : '未知错误') }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    {
      name: 'Home',
      href: '/ai2',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      ),
    },
    {
      name: 'ChatGPT',
      href: '/ai2/chatgpt',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
    },
    {
      name: 'Gemini',
      href: '/ai2/gemini',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-2 py-2 h-screen">
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden border border-purple-100">
          <ClaudeInterface
            messages={messages}
            loading={loading}
            onSendMessage={sendMessage}
            bilingual={bilingual}
            setBilingual={setBilingual}
            navigationItems={navigationItems}
          />
        </div>
      </div>
    </main>
  );
} 