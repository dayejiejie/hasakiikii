"use client";

import { useState } from "react";
import ChatInterface, { ModelType } from "@/components/ChatInterface";
import { Message } from "@/types/chat";

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<ModelType>('gpt-4o-all');
  const [bilingual, setBilingual] = useState(false);

  const sendMessage = async (message: string, image?: File, role: 'user' | 'assistant' = 'user', bilingual: boolean = false, model: ModelType = 'gpt-4o-all') => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('message', message);
      formData.append('model', model);
      formData.append('role', role);
      formData.append('bilingual', String(bilingual));

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API请求失败: ${response.status} ${response.statusText}`);
      }
      
      if (!data.reply) {
        throw new Error('API返回数据格式错误');
      }

      setMessages(prev => [...prev, 
        { role: 'user', content: message },
        { 
          role: 'assistant', 
          content: bilingual ? data.reply.split('---')[0].trim() : data.reply,
          translation: bilingual ? data.reply.split('---')[1]?.trim() : undefined
        }
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: '抱歉，发生了错误：' + (error instanceof Error ? error.message : '未知错误') }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ChatInterface
      aiName="AI 助手"
      messages={messages}
      loading={loading}
      model={model}
      setModel={setModel}
      bilingual={bilingual}
      setBilingual={setBilingual}
      onSendMessage={sendMessage}
      navigationItems={[]}
      hideModelSelect={false}
    />
  );
} 