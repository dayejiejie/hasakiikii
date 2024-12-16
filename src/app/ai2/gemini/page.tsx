'use client';
import { useState } from 'react';
import GeminiInterface from '@/components/GeminiInterface';

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
      
      const newMessages = [
        ...messages,
        { role: 'user' as const, content: message }
      ];
      setMessages(newMessages);

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          bilingual: bilingual
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '请求失败');
      }

      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: data.reply,
        translation: bilingual ? data.translation : undefined
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('发送消息错误:', error);
      setMessages([
        ...messages,
        {
          role: 'assistant' as const,
          content: '发送消息失败: ' + (error instanceof Error ? error.message : '未知错误')
        }
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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
    },
    {
      name: 'Claude',
      href: '/ai2/claude',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 py-2 h-screen">
        <div className="h-full bg-white rounded-xl shadow-lg overflow-hidden">
          <GeminiInterface
            aiName="Gemini"
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