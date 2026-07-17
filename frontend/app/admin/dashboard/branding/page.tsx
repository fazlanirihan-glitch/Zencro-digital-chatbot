'use client';

import React, { useState, useEffect } from 'react';
import { Palette, MessageSquare, Save, CheckCircle2 } from 'lucide-react';

export default function BrandingManager() {
  const [branding, setBranding] = useState({
    companyName: 'ZenCro Digital',
    tagline: 'AI Solutions for the Modern Web',
    primaryColor: '#3b82f6', // blue-500
    secondaryColor: '#1d4ed8', // blue-700
    welcomeMessage: 'Hello! I am the ZenCro AI assistant. How can I help you scale today?',
    suggestedPrompts: 'Build a Website, Get a Quote, AI Automations',
    whatsappNumber: '+1234567890',
    avatarUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // In a real implementation, this would fetch from /api/v1/company/branding
  useEffect(() => {
    const localBranding = localStorage.getItem('zencro_branding_config');
    if (localBranding) {
      setBranding(JSON.parse(localBranding));
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock API call to save company branding
    setTimeout(() => {
      localStorage.setItem('zencro_branding_config', JSON.stringify(branding));
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">White-Label Branding</h1>
          <span className="text-xs text-slate-400">Customize the AI chatbot's visual identity and copy.</span>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* General Info */}
          <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl glassmorphism space-y-4">
            <h3 className="font-semibold text-sm border-b border-slate-900 pb-2 flex items-center space-x-2">
              <MessageSquare size={16} className="text-blue-400" />
              <span>Identity & Messaging</span>
            </h3>
            
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Company Name</label>
              <input
                type="text"
                required
                value={branding.companyName}
                onChange={(e) => setBranding({...branding, companyName: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Tagline</label>
              <input
                type="text"
                value={branding.tagline}
                onChange={(e) => setBranding({...branding, tagline: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Welcome Message</label>
              <textarea
                rows={3}
                value={branding.welcomeMessage}
                onChange={(e) => setBranding({...branding, welcomeMessage: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Suggested Prompts (comma separated)</label>
              <input
                type="text"
                value={branding.suggestedPrompts}
                onChange={(e) => setBranding({...branding, suggestedPrompts: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Build Website, Contact Sales"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">WhatsApp Integration Number</label>
              <input
                type="text"
                value={branding.whatsappNumber}
                onChange={(e) => setBranding({...branding, whatsappNumber: e.target.value})}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Visuals */}
          <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl glassmorphism space-y-4">
            <h3 className="font-semibold text-sm border-b border-slate-900 pb-2 flex items-center space-x-2">
              <Palette size={16} className="text-pink-400" />
              <span>Visual Appearance</span>
            </h3>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-400 font-medium mb-1">Primary Color HEX</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                    className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) => setBranding({...branding, primaryColor: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 uppercase"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] text-slate-400 font-medium mb-1">Secondary Color HEX</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                    className="w-8 h-8 rounded border-none bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.secondaryColor}
                    onChange={(e) => setBranding({...branding, secondaryColor: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-slate-100 uppercase"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Custom AI Avatar URL</label>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full border-2 border-slate-800 bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden">
                  {branding.avatarUrl ? (
                    <img src={branding.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={18} className="text-slate-600" />
                  )}
                </div>
                <input
                  type="text"
                  value={branding.avatarUrl}
                  onChange={(e) => setBranding({...branding, avatarUrl: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-900">
              <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                These settings directly manipulate the CSS variables and context injected into the ChatWidget on the frontend website. Note: AI Avatars must be hosted on a public URL.
              </p>
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
                    <span>Save White-Label Branding</span>
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
