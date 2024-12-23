'use client';

import { useEffect, useState } from 'react';

export default function NotePage({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<any>(null);

  useEffect(() => {
    // 这里可以添加获取笔记内容的逻辑
    setLoading(false);
    setNote({ title: `Note ${id}`, content: 'Sample note content' });
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p>Loading note content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{note?.title}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p>{note?.content}</p>
      </div>
    </div>
  );
} 