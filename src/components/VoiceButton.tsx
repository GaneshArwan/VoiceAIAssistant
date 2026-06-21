'use client';

import React from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';

interface VoiceButtonProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  onStart: () => void;
  onStop: () => void;
  onInterrupt: () => void;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ state, onStart, onStop, onInterrupt }) => {
  const isIdle = state === 'idle';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const isSpeaking = state === 'speaking';

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="relative flex items-center justify-center h-40 w-40">
        {/* Background Aura */}
        <div 
          className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 
            ${isIdle ? 'bg-emerald-500/10 scale-90' : ''}
            ${isListening ? 'bg-red-500/30 scale-125 animate-pulse' : ''}
            ${isThinking ? 'bg-emerald-300/20 scale-100' : ''}
            ${isSpeaking ? 'bg-emerald-400/40 scale-150 animate-pulse' : ''}
          `}
        />

        {/* Waveform Animation */}
        {(isListening || isSpeaking) && (
          <div className="absolute inset-0 flex items-center justify-center gap-1.5 z-0">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full ${isListening ? 'bg-red-400' : 'bg-emerald-400'} animate-waveform`}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  opacity: isListening ? 0.9 : 1,
                }}
              />
            ))}
          </div>
        )}

        <button
          onClick={() => {
            if (isIdle) onStart();
            else if (isListening) onStop();
            else if (isSpeaking) onInterrupt();
          }}
          disabled={isThinking}
          className={`
            relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500
            ${isIdle ? 'glossy-emerald hover:scale-110' : ''}
            ${isListening ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-[0_0_40px_rgba(239,68,68,0.6)] scale-95' : ''}
            ${isThinking ? 'glass border-emerald-500/30 text-emerald-500 dark:text-emerald-400 cursor-not-allowed shadow-none' : ''}
            ${isSpeaking ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-[0_0_50px_rgba(52,211,153,0.5)] scale-105' : ''}
          `}
        >
          {isIdle && <Mic size={36} className="drop-shadow-md" />}
          {isListening && <Square size={32} className="fill-white" />}
          {isThinking && <Loader2 size={40} className="animate-spin" />}
          {isSpeaking && <Volume2 size={40} className="drop-shadow-md animate-pulse" />}
        </button>
      </div>

      <p className={`text-lg font-bold tracking-widest uppercase transition-colors duration-300
        ${isIdle ? 'text-slate-600 dark:text-slate-400' : ''}
        ${isListening ? 'text-red-500 animate-pulse' : ''}
        ${isThinking ? 'text-emerald-500/70 animate-pulse' : ''}
        ${isSpeaking ? 'text-emerald-500' : ''}
      `}>
        {state === 'idle' ? 'Tap to Speak' : state}
      </p>
    </div>
  );
};
