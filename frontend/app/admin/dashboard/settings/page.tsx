'use client';

import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, Save, CheckCircle2 } from 'lucide-react';

export default function AISettingsManager() {
  const [config, setConfig] = useState({
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: `You are a professional AI Assistant for ZenCro Digital.\n\nYour primary goal is to assist users, answer questions using the knowledge base, and capture lead information gracefully.`
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const localConfig = localStorage.getItem('zencro_ai_config');
    if (localConfig) {
      const parsedConfig = JSON.parse(localConfig);
      setTimeout(() => setConfig(parsedConfig), 0);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock API call to save AI config
    setTimeout(() => {
      localStorage.setItem('zencro_ai_config', JSON.stringify(config));
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">AI Engine Configuration</h1>
          <span className="text-xs text-slate-400">Control provider models, creativity (temperature), and system behavior.</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Engine Settings */}
          <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl glassmorphism space-y-5">
            <h3 className="font-semibold text-sm border-b border-slate-900 pb-2 flex items-center space-x-2">
              <Cpu size={16} className="text-purple-400" />
              <span>Model & Provider</span>
            </h3>
            
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">AI Provider</label>
              <select
                value={config.provider}
                onChange={(e) => setConfig({...config, provider: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="gemini">Google Gemini</option>
                <option value="openai" disabled>OpenAI (Phase 8 Multi-Provider)</option>
                <option value="anthropic" disabled>Anthropic (Phase 8 Multi-Provider)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Active Model</label>
              <select
                value={config.model}
                onChange={(e) => setConfig({...config, model: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Cheap)</option>
                <option value="gemini-2.5-pro">gemini-2.5-pro (High Reasoning)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-slate-400 font-medium">Temperature (Creativity)</label>
                <span className="text-[10px] text-purple-400 font-mono">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[8px] text-slate-500 mt-1">
                <span>Strict/Robotic</span>
                <span>Creative/Loose</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Max Response Tokens</label>
              <input
                type="number"
                value={config.maxTokens}
                onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Prompt Engineering */}
          <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl glassmorphism flex flex-col">
            <h3 className="font-semibold text-sm border-b border-slate-900 pb-2 flex items-center space-x-2">
              <Terminal size={16} className="text-green-400" />
              <span>Base System Prompt</span>
            </h3>
            
            <div className="mt-4 flex-1 flex flex-col">
              <label className="block text-[10px] text-slate-400 font-medium mb-2">
                This dictates the core personality and rules of the AI. (Phase 8 will introduce full Prompt Versioning).
              </label>
              <textarea
                value={config.systemPrompt}
                onChange={(e) => setConfig({...config, systemPrompt: e.target.value})}
                className="w-full flex-1 bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-xs font-mono text-slate-300 focus:outline-none focus:border-green-500 leading-relaxed resize-none min-h-[200px]"
                placeholder="You are an AI assistant..."
              />
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-900">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold text-xs py-3 rounded-xl transition-all shadow-md flex justify-center items-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : saved ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Configuration Saved</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Update AI Engine</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
