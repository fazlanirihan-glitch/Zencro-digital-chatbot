'use client';

import React, { useState } from 'react';
import { Terminal, Save, Play, Clock, CheckCircle2, History } from 'lucide-react';

export default function PromptStudio() {
  const [prompt, setPrompt] = useState(
    "You are a professional AI Assistant for {company_name}.\n\nYour primary goal is to assist users, answer questions using the knowledge base, and capture lead information gracefully.\n\nNever break character."
  );
  
  const [versions] = useState([
    { id: 'v1.0.3', date: 'Today, 10:42 AM', active: true },
    { id: 'v1.0.2', date: 'Yesterday, 4:15 PM', active: false },
    { id: 'v1.0.1', date: 'Jul 12, 9:00 AM', active: false },
  ]);

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Prompt Engineering Studio</h1>
          <span className="text-xs text-slate-400">Version control and playground for the core AI system instructions.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
        {/* Editor */}
        <div className="md:col-span-2 bg-slate-950/40 border border-slate-900 rounded-2xl glassmorphism flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-900 bg-slate-900/30 flex justify-between items-center shrink-0">
            <h3 className="font-semibold text-xs flex items-center space-x-2">
              <Terminal size={14} className="text-green-400" />
              <span>Base System Prompt</span>
            </h3>
            <span className="text-[10px] bg-green-950/50 text-green-400 px-2 py-0.5 rounded border border-green-900/40 font-mono">
              v1.0.3 (Live)
            </span>
          </div>
          
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-[13px] font-mono text-slate-300 focus:outline-none focus:border-green-500 leading-relaxed resize-none"
            />
            
            <div className="mt-4 flex items-center justify-end space-x-3">
              <button className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all">
                <Play size={14} />
                <span>Test in Playground</span>
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center space-x-2 transition-all">
                <Save size={14} />
                <span>Commit New Version</span>
              </button>
            </div>
          </div>
        </div>

        {/* Version History & Playground Config */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl glassmorphism flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-900 bg-slate-900/30 flex items-center space-x-2 shrink-0">
            <History size={14} className="text-blue-400" />
            <h3 className="font-semibold text-xs text-slate-200">Version History</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {versions.map(v => (
              <button key={v.id} className={`w-full text-left p-3 rounded-xl border flex items-center justify-between transition-all ${v.active ? 'bg-blue-900/10 border-blue-900/50' : 'bg-slate-900/20 border-slate-800 hover:bg-slate-900'}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-mono font-bold ${v.active ? 'text-blue-400' : 'text-slate-300'}`}>{v.id}</span>
                    {v.active && <CheckCircle2 size={12} className="text-blue-400" />}
                  </div>
                  <span className="text-[9px] text-slate-500 flex items-center space-x-1 mt-1">
                    <Clock size={10} />
                    <span>{v.date}</span>
                  </span>
                </div>
                {!v.active && (
                  <span className="text-[9px] text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded">Rollback</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-4 border-t border-slate-900 bg-slate-900/20">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Playground Context</h4>
            <select className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none mb-2">
              <option>Simulate: ZenCro Digital (Tenant ID: 001)</option>
              <option>Simulate: FitLife Gyms (Tenant ID: 002)</option>
            </select>
            <p className="text-[9px] text-slate-500">Playground uses simulated RAG data for the selected tenant.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
