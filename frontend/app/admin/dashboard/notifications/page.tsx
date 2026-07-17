'use client';

import React, { useState } from 'react';
import { Bell, AlertTriangle, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';

export default function NotificationCenter() {
  const [notifications] = useState([
    { id: '1', type: 'alert', title: 'High Intent Lead Captured', desc: 'Sarah Jenkins requested a quote for Web Development.', time: '10 mins ago', read: false },
    { id: '2', type: 'system', title: 'Knowledge Indexed', desc: 'New PDF document "Pricing_2026.pdf" successfully processed.', time: '1 hour ago', read: false },
    { id: '3', type: 'error', title: 'WhatsApp Webhook Failed', desc: 'Meta API rate limit exceeded. Engine paused for 60s.', time: '3 hours ago', read: true },
  ]);

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Notification Center</h1>
          <span className="text-xs text-slate-400">Manage alerts from Chat, Voice, WhatsApp, and System Events.</span>
        </div>
        <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1">
          <CheckCircle2 size={14} />
          <span>Mark All Read</span>
        </button>
      </div>

      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl glassmorphism overflow-hidden">
        <div className="divide-y divide-slate-900/50">
          {notifications.map(n => (
            <div key={n.id} className={`p-4 hover:bg-slate-900/20 transition-colors flex items-start gap-4 ${n.read ? 'opacity-60' : 'bg-blue-900/5'}`}>
              <div className="shrink-0 mt-1">
                {n.type === 'alert' && <Bell size={18} className="text-yellow-400" />}
                {n.type === 'system' && <ShieldCheck size={18} className="text-green-400" />}
                {n.type === 'error' && <AlertTriangle size={18} className="text-red-400" />}
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-slate-200">{n.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                <span className="text-[9px] text-slate-500 mt-2 block">{n.time}</span>
              </div>
              <button className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-1 rounded text-slate-400 hover:text-white">
                Dismiss
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
