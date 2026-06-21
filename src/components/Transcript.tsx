'use client';

import React, { useEffect, useRef } from 'react';
import { Bot, User } from 'lucide-react';

export interface Message {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  latency?: number;
}

interface TranscriptProps {
  messages: Message[];
}

export const Transcript: React.FC<TranscriptProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-emerald-500/50 space-y-4 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s' }}>
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center animate-float">
          <Bot size={32} className="text-emerald-500/50" />
        </div>
        <p className="italic text-sm font-medium tracking-wide">Your conversation will appear here...</p>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth w-full max-w-4xl mx-auto"
    >
      {messages.map((msg, idx) => (
        <div 
          key={idx}
          className={`flex w-full animate-fade-in-up opacity-0 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          style={{ animationDelay: '0.1s' }}
        >
          <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 shadow-sm ${msg.role === 'user' ? 'bg-emerald-500 text-white' : 'glass-emerald text-emerald-600 dark:text-emerald-400'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div 
                className={`
                  p-4 md:p-5 rounded-2xl shadow-sm text-[15px] leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-900 dark:text-emerald-50 rounded-tr-sm border border-emerald-100 dark:border-emerald-800/50' 
                    : 'glass text-slate-800 dark:text-slate-100 rounded-tl-sm'}
                `}
              >
                {msg.text}
              </div>
              <div className={`flex items-center gap-2 mt-2 px-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.latency && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                    {msg.latency}ms
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
