'use client';

import React, { useState } from 'react';
import { Building2, Key, Database, PlayCircle, PlusCircle, Server } from 'lucide-react';

export default function SaaSCompanyManager() {
  const [companies] = useState([
    { id: 'c_zencro_001', name: 'ZenCro Digital', plan: 'Enterprise', active: true, usage: '2.4MB' },
    { id: 'c_fitlife_002', name: 'FitLife Gyms', plan: 'Pro', active: true, usage: '0.8MB' },
    { id: 'c_bistro_003', name: 'Bistro 42', plan: 'Starter', active: false, usage: '0.1MB' }
  ]);

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">SaaS Tenant Manager</h1>
          <span className="text-xs text-slate-400">Onboard new companies and manage their isolated AI instances.</span>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-lg flex items-center space-x-2 transition-all">
          <PlusCircle size={14} />
          <span>Onboard Client</span>
        </button>
      </div>

      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl glassmorphism overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/60 border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="p-4">Company Name</th>
              <th className="p-4">Tenant ID</th>
              <th className="p-4 text-center">Plan</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Knowledge Usage</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900/50">
            {companies.map(c => (
              <tr key={c.id} className="hover:bg-slate-900/20 transition-colors">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                      <Building2 size={14} className="text-blue-400" />
                    </div>
                    <span className="font-semibold text-slate-200">{c.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className="font-mono text-[9px] text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    {c.id}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-900/50">
                    {c.plan}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold flex items-center justify-center space-x-1 w-fit mx-auto ${c.active ? 'text-green-400' : 'text-slate-500'}`}>
                    <Server size={10} />
                    <span>{c.active ? 'Active' : 'Suspended'}</span>
                  </span>
                </td>
                <td className="p-4 text-right text-[10px] text-slate-400 font-mono">
                  <span className="flex items-center justify-end space-x-1">
                    <Database size={10} />
                    <span>{c.usage}</span>
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="text-slate-500 hover:text-emerald-400 transition-colors" title="Deploy White-label UI">
                      <PlayCircle size={14} />
                    </button>
                    <button className="text-slate-500 hover:text-yellow-400 transition-colors" title="Rotate API Keys">
                      <Key size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
