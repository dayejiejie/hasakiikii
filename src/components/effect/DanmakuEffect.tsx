'use client';

import { useEffect, useState } from 'react';

interface DanmakuItem {
  id: string;
  text: string;
  name: string;
  color: string;
  top: number;
  createdAt: string;
}

export function DanmakuEffect() {
  const [danmakus, setDanmakus] = useState<DanmakuItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [username, setUsername] = useState('');
  const [debug, setDebug] = useState(false);
  const [visibleDanmakus, setVisibleDanmakus] = useState<DanmakuItem[]>([]);
  const [isDanmakuEnabled, setIsDanmakuEnabled] = useState(true);
  const [lastDisplayTimes, setLastDisplayTimes] = useState<Record<string, number>>({});  // 记录每条弹幕最后显示时间
  const [showTip, setShowTip] = useState(false);  // 添加提示显示状态

  const MAX_VISIBLE_DANMAKUS = 20; // 增加到20条同时显示
  const DISPLAY_INTERVAL = 1000; // 每隔1秒检查是否需要显示新弹幕
  const REPLAY_DELAY = 10000; // 同一条弹幕的重播延迟（10秒）

  // 更新颜色方案为亮色系
  const colors = [
    'rgb(255, 255, 255)',     // 纯白色
    'rgb(255, 192, 203)',     // 亮粉色
    'rgb(135, 206, 250)',     // 亮天蓝色
    'rgb(144, 238, 144)',     // 亮绿色
    'rgb(255, 182, 193)',     // 浅粉红
    'rgb(255, 218, 185)',     // 蜜桃色
    'rgb(176, 224, 230)',     // 粉蓝色
    'rgb(255, 255, 224)',     // 浅黄色
    'rgb(230, 230, 250)',     // 淡紫色
    'rgb(240, 248, 255)',     // 爱丽丝蓝
  ];

  // 管理可见弹幕
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (danmakus.length > 0) {
        setVisibleDanmakus(prev => {
          // 移除已经完成动画的弹幕
          const now = Date.now();
          const filtered = prev.filter(d => now - parseInt(d.id) < 12000); // 匹配动画时长
          
          // 如果还有空间，尝试添加新弹幕
          if (filtered.length < MAX_VISIBLE_DANMAKUS && danmakus.length > currentIndex) {
            const nextDanmaku = danmakus[currentIndex];
            const key = `${nextDanmaku.text}-${nextDanmaku.name}`;
            const lastDisplayTime = lastDisplayTimes[key] || 0;
            
            // 检查是否已经过了重播延迟时间
            if (now - lastDisplayTime >= REPLAY_DELAY) {
              currentIndex = (currentIndex + 1) % danmakus.length;
              filtered.push({
                ...nextDanmaku,
                id: now.toString()
              });
              
              // 更新显示时间
              setLastDisplayTimes(prev => ({
                ...prev,
                [key]: now
              }));
            }
          }
          
          return filtered;
        });
      }
    }, DISPLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [danmakus, lastDisplayTimes]);

  useEffect(() => {
    const fetchDanmakus = async () => {
      try {
        const response = await fetch('/api/danmaku');
        const data = await response.json();
        console.log('Fetched danmakus:', data);
        setDanmakus(data);
      } catch (error) {
        console.error('Failed to fetch danmakus:', error);
      }
    };

    fetchDanmakus();
    const interval = setInterval(fetchDanmakus, 10000);
    return () => clearInterval(interval);
  }, []);

  const addDanmaku = async (text: string, username: string) => {
    if (!text.trim() || !username.trim()) return;
    
    const newDanmaku: DanmakuItem = {
      id: Date.now().toString(),
      text,
      name: username,
      color: colors[Math.floor(Math.random() * colors.length)],
      top: Math.random() * 70 + 10,
      createdAt: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/danmaku', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: newDanmaku.text,
          name: newDanmaku.name,
          color: newDanmaku.color,
          top: newDanmaku.top,
        }),
      });

      if (response.ok) {
        const savedDanmaku = await response.json();
        console.log('Saved danmaku:', savedDanmaku);
        setDanmakus(prev => [savedDanmaku, ...prev]);
        // 如果当前显示的弹幕少于最大数量，直接显示新弹幕
        setVisibleDanmakus(prev => {
          if (prev.length < MAX_VISIBLE_DANMAKUS) {
            return [...prev, savedDanmaku];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error('Failed to save danmaku:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDanmaku(inputText, username);
    setInputText('');
  };

  // 处理提示显示和自动消失
  useEffect(() => {
    if (showTip) {
      const timer = setTimeout(() => {
        setShowTip(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showTip]);

  return (
    <>
      <style jsx global>{`
        @keyframes danmaku {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          2% {
            transform: translateX(-2vw);
            opacity: 1;
          }
          95% {
            transform: translateX(-95vw);
            opacity: 1;
          }
          100% {
            transform: translateX(-100vw);
            opacity: 0;
          }
        }
        
        .danmaku {
          position: absolute;
          white-space: nowrap;
          will-change: transform;
          backdrop-filter: blur(1.5px);
          padding: 4px 12px;
          border-radius: 20px;
          letter-spacing: 0.5px;
          transition: all 0.2s ease;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          animation: danmaku 12s linear;
          right: 0;
        }
        
        .danmaku:hover {
          transform: scale(1.05) !important;
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(2px);
          animation-play-state: paused;
        }
      `}</style>

      {isDanmakuEnabled && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 11 }}>
          {visibleDanmakus.map((danmaku, index) => (
            <div
              key={danmaku.id}
              className="danmaku"
              style={{
                top: `${danmaku.top}%`,
                color: danmaku.color,
                fontSize: '0.875rem',
                fontWeight: '500',
                animationDelay: `${index * 0.2}s`,
              }}
              onAnimationEnd={() => {
                setVisibleDanmakus(prev => prev.filter(d => d.id !== danmaku.id));
              }}
            >
              <span className="mr-2">{danmaku.text}</span>
              <span style={{ 
                fontSize: '0.75em',
                opacity: 0.95,
                fontStyle: 'italic',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '2px 8px',
                borderRadius: '10px',
                color: 'rgb(255, 255, 255)',
              }}>@{danmaku.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {debug && (
        <div className="fixed top-4 left-4 bg-black/50 text-white p-4 rounded-lg" style={{ zIndex: 10000 }}>
          <div>总弹幕数: {danmakus.length}</div>
          <div>当前显示: {visibleDanmakus.length}</div>
          <button 
            onClick={() => setDebug(false)}
            className="mt-2 px-2 py-1 bg-white/10 rounded hover:bg-white/20"
          >
            关闭调试
          </button>
        </div>
      )}
      
      <button
        type="button"
        onClick={() => setIsDanmakuEnabled(prev => !prev)}
        className={`fixed top-4 right-4 px-4 py-1.5 rounded-full text-sm transition-all z-[101]
          ${isDanmakuEnabled 
            ? 'bg-white/20 text-white hover:bg-white/30' 
            : 'bg-white/10 text-white/50 hover:bg-white/15'
          }
          border border-white/10 backdrop-blur-sm`}
      >
        {isDanmakuEnabled ? '关闭弹幕' : '开启弹幕'}
      </button>
      
      <div className="fixed sm:bottom-[10%] bottom-[2%] left-0 right-0" style={{ zIndex: 101 }}>
        <form 
          onSubmit={handleSubmit}
          className="max-w-sm mx-auto px-4"
        >
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="你的名字..."
              className="w-1/3 px-3 py-1.5 text-sm rounded-full bg-black/20 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:border-white/30 transition-all hover:bg-black/30"
              maxLength={20}
            />
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="说点什么..."
              className="flex-1 px-3 py-1.5 text-sm rounded-full bg-black/20 text-white placeholder-white/50 border border-white/10 focus:outline-none focus:border-white/30 transition-all hover:bg-black/30"
              maxLength={50}
            />
            <div className="relative">
              <button
                type="submit"
                className="h-[28px] w-[28px] rounded-full bg-black/20 text-white hover:bg-black/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 border border-white/10 flex items-center justify-center"
                disabled={!username.trim() || !inputText.trim()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* 提示框 - 修改位置和样式 */}
      {showTip && (
        <div 
          className="fixed sm:bottom-4 bottom-0 right-4 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm z-[102] text-sm whitespace-nowrap"
        >
          如果遇到BUG，请发送电子邮件到2465335064@qq.com反馈，谢谢
        </div>
      )}
      
      <div className="fixed sm:bottom-4 bottom-0 right-4" style={{ zIndex: 101 }}>
        <button
          type="button"
          onClick={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
          className="bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </>
  );
} 