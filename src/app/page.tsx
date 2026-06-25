'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { VoiceButton } from '@/components/VoiceButton';
import { Transcript, Message } from '@/components/Transcript';
import { AudioRecorder } from '@/lib/audio';
import { SettingsDialog, AppSettings } from '@/components/SettingsDialog';

export default function VoiceAssistant() {
  const [state, setState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingStartTimeRef = useRef<number>(0);

  const interrupt = useCallback(() => {
    abortControllerRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setState('idle');
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('voiceai_settings');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAppSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    } else {
      setIsSettingsOpen(true);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!appSettings) {
      setIsSettingsOpen(true);
      return;
    }
    if (state !== 'idle') return;
    interrupt(); // abort any ongoing pipeline
    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorder();
      }
      await recorderRef.current.start();
      setState('listening');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone.');
    }
  }, [appSettings, interrupt, state]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || !appSettings) return;
    if (state !== 'listening') return;

    setState('thinking');
    thinkingStartTimeRef.current = Date.now();

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const audioBlob = await recorderRef.current.stop();
      
      const formData = new FormData();
      formData.append('file', audioBlob);
      formData.append('settings', JSON.stringify(appSettings.stt));
      
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      });
      
      if (!transcribeRes.ok) {
        const errorData = await transcribeRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Transcription failed: ${transcribeRes.status}`);
      }
      
      const transcribeData = await transcribeRes.json();
      const userText = transcribeData.text;
      
      if (!userText) {
        setState('idle');
        return;
      }

      const userMessage: Message = {
        role: 'user',
        text: userText,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, userMessage]);

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].slice(-10).map(m => ({ 
            role: m.role, 
            content: m.text 
          })),
          settings: appSettings.llm
        }),
        signal: abortController.signal,
      });

      if (!chatRes.ok) {
        const errorData = await chatRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Chat response failed: ${chatRes.status}`);
      }

      const chatData = await chatRes.json();
      const assistantText = chatData.text;

      const latency = Date.now() - thinkingStartTimeRef.current;
      const assistantMessage: Message = {
        role: 'assistant',
        text: assistantText,
        timestamp: Date.now(),
        latency,
      };
      setMessages(prev => [...prev, assistantMessage]);

      const speakRes = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            text: assistantText,
            settings: appSettings.tts 
        }),
        signal: abortController.signal,
      });
      
      if (!speakRes.ok) {
        const errorData = await speakRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Speech generation failed: ${speakRes.status}`);
      }
      
      const audioBlobOutput = await speakRes.blob();
      
      if (abortController.signal.aborted) return;

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      
      const audioUrl = URL.createObjectURL(audioBlobOutput);
      audioUrlRef.current = audioUrl;
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onplay = () => setState('speaking');
      audio.onended = () => {
        setState('idle');
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
        }
      };
      
      await audio.play();

    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Pipeline aborted');
        return;
      }
      console.error('Pipeline error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
      setState('idle');
    }
  }, [messages, appSettings, state]);


  return (
    <main className="flex flex-col h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-50 font-sans relative overflow-hidden">
      {/* Premium Animated Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-400/10 dark:bg-teal-800/10 rounded-full blur-[120px] animate-float" style={{ animationDuration: '8s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.05),transparent_60%)]" />
      </div>

      <header className="relative z-10 px-6 py-4 border-b border-white/40 dark:border-slate-800/50 bg-white/40 dark:bg-[#020617]/50 backdrop-blur-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-300">VoiceAI</h1>
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Ultra-low latency</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
            {state === 'idle' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse" />}
            {state === 'listening' && <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse" />}
            {state === 'thinking' && <div className="w-2 h-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />}
            {state === 'speaking' && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />}
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300">{state}</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
        <Transcript messages={messages} />
      </div>

      <footer className="relative z-10 p-8 pb-12 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#020617] dark:via-[#020617]/80 dark:to-transparent flex justify-center">
        <VoiceButton 
          state={state}
          onStart={startRecording}
          onStop={stopRecording}
          onInterrupt={interrupt}
        />
      </footer>

      <SettingsDialog 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        onSave={(newSettings) => setAppSettings(newSettings)}
      />
    </main>
  );
}
