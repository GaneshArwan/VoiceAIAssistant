'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface ProviderConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseURL?: string;
  projectId?: string;
}

export interface AppSettings {
  stt: ProviderConfig;
  llm: ProviderConfig;
  tts: ProviderConfig;
}

const defaultSettings: AppSettings = {
  stt: { provider: 'gemini', apiKey: '', model: 'gemini-1.5-flash', baseURL: 'http://localhost:1234/v1' },
  llm: { provider: 'gemini', apiKey: '', model: 'gemini-1.5-flash', baseURL: 'http://localhost:1234/v1' },
  tts: { provider: 'google', apiKey: '', model: 'default', baseURL: 'http://localhost:1234/v1' },
};

interface CustomSelectProps {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ label, value, options, onChange }) => (
  <div className="relative group">
    <label className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-widest ml-1 mb-1 block">
      {label}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none p-3 pr-10 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-900/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900">
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500/50 group-hover:text-emerald-500 transition-colors">
        <ChevronDown size={16} />
      </div>
    </div>
  </div>
);

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, onSave }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('voiceai_settings');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('voiceai_settings', JSON.stringify(settings));
    onSave(settings);
    onClose();
  };

  const updateSection = (section: keyof AppSettings, field: keyof ProviderConfig, value: string) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="glass-emerald rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-emerald-400/20">
        <div className="flex items-center justify-between p-6 border-b border-emerald-200/20 dark:border-emerald-500/10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">System Core</h2>
            <p className="text-[10px] font-medium text-emerald-500/70 uppercase tracking-[0.2em] mt-0.5">Configuration & BYOK</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 transition-all"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto space-y-8 flex-1 scrollbar-thin">
          {/* LLM Settings */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-emerald-400/40 border-b border-emerald-500/10 pb-2">Intelligence (LLM)</h3>
            <CustomSelect 
              label="Provider"
              value={settings.llm.provider} 
              onChange={(val) => updateSection('llm', 'provider', val)}
              options={[
                { label: 'Google Gemini', value: 'gemini' },
                { label: 'OpenAI', value: 'openai' },
                { label: 'Anthropic Claude', value: 'anthropic' },
                { label: 'Local (Ollama/LM Studio)', value: 'local' },
              ]}
            />
            {settings.llm.provider === 'local' && (
              <input 
                type="text" 
                placeholder="Base URL (e.g. http://localhost:11434/v1)" 
                value={settings.llm.baseURL || ''}
                onChange={(e) => updateSection('llm', 'baseURL', e.target.value)}
                className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              />
            )}
            <input 
              type={settings.llm.provider === 'local' ? 'text' : 'password'} 
              placeholder={settings.llm.provider === 'local' ? "API Key (Optional)" : "API Key"} 
              value={settings.llm.apiKey}
              onChange={(e) => updateSection('llm', 'apiKey', e.target.value)}
              className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            />
            <input 
              type="text" 
              placeholder="Model ID (e.g. gemini-1.5-flash)" 
              value={settings.llm.model}
              onChange={(e) => updateSection('llm', 'model', e.target.value)}
              className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            />
          </div>

          {/* STT Settings */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-emerald-400/40 border-b border-emerald-500/10 pb-2">Perception (STT)</h3>
            <CustomSelect 
              label="Provider"
              value={settings.stt.provider} 
              onChange={(val) => updateSection('stt', 'provider', val)}
              options={[
                { label: 'Google Gemini', value: 'gemini' },
                { label: 'OpenAI Whisper', value: 'openai' },
                { label: 'Local (Whisper-compatible)', value: 'local' },
              ]}
            />
            {settings.stt.provider === 'local' && (
              <input 
                type="text" 
                placeholder="Base URL" 
                value={settings.stt.baseURL || ''}
                onChange={(e) => updateSection('stt', 'baseURL', e.target.value)}
                className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              />
            )}
            <input 
              type={settings.stt.provider === 'local' ? 'text' : 'password'} 
              placeholder="API Key" 
              value={settings.stt.apiKey}
              onChange={(e) => updateSection('stt', 'apiKey', e.target.value)}
              className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            />
            <input 
              type="text" 
              placeholder="Model ID" 
              value={settings.stt.model}
              onChange={(e) => updateSection('stt', 'model', e.target.value)}
              className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
            />
          </div>

          {/* TTS Settings */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-emerald-400/40 border-b border-emerald-500/10 pb-2">Synthesis (TTS)</h3>
            <CustomSelect 
              label="Provider"
              value={settings.tts.provider} 
              onChange={(val) => updateSection('tts', 'provider', val)}
              options={[
                { label: 'Google Translate (Free)', value: 'google' },
                { label: 'Google Gemini (Multimodal)', value: 'gemini' },
                { label: 'OpenAI TTS', value: 'openai' },
                { label: 'ElevenLabs', value: 'elevenlabs' },
                { label: 'Local / Custom', value: 'local' },
              ]}
            />
            {settings.tts.provider === 'local' && (
              <input 
                type="text" 
                placeholder="Base URL" 
                value={settings.tts.baseURL || ''}
                onChange={(e) => updateSection('tts', 'baseURL', e.target.value)}
                className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              />
            )}
            {settings.tts.provider === 'gemini' && (
              <input 
                type="text" 
                placeholder="Google Cloud Project ID (Optional)" 
                value={settings.tts.projectId || ''}
                onChange={(e) => updateSection('tts', 'projectId', e.target.value)}
                className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
              />
            )}
            {settings.tts.provider !== 'google' && (
              <>
                <input 
                  type={settings.tts.provider === 'local' ? 'text' : 'password'} 
                  placeholder="API Key" 
                  value={settings.tts.apiKey}
                  onChange={(e) => updateSection('tts', 'apiKey', e.target.value)}
                  className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                />
                <input 
                  type="text" 
                  placeholder={settings.tts.provider === 'elevenlabs' ? "Voice ID (e.g. pMs2u942..." : "Model ID (e.g. tts-1)"} 
                  value={settings.tts.model}
                  onChange={(e) => updateSection('tts', 'model', e.target.value)}
                  className="w-full p-3 rounded-xl border border-emerald-200/30 dark:border-emerald-500/10 bg-white/50 dark:bg-emerald-950/20 text-sm focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
                />
              </>
            )}
          </div>
        </div>
        
        <div className="p-6 border-t border-emerald-200/20 dark:border-emerald-500/10 bg-emerald-500/5 flex justify-end">
          <button 
            onClick={handleSave}
            className="px-10 py-3 glossy-emerald rounded-2xl text-sm font-bold transition-all hover:scale-105 active:scale-95 shadow-emerald-500/40"
          >
            Synchronize Engine
          </button>
        </div>
      </div>
    </div>
  );
};
