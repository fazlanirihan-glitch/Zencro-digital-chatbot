'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, PlusCircle, Trash2 } from 'lucide-react';

interface Portfolio {
  id: string;
  title: string;
  description: string;
  client: string;
  results: string;
  stack: string[];
}

export default function PortfolioManager() {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPortfolio, setNewPortfolio] = useState({ title: '', description: '', client: '', results: '', stack: '' });

  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiHost}/api/v1/portfolio`);
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.data || data);
      }
    } catch (e) {
      console.error("Error fetching portfolio:", e);
    } finally {
      setLoading(false);
    }
  }, [apiHost]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPortfolio();
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchPortfolio]);

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const payload = {
        ...newPortfolio,
        stack: newPortfolio.stack.split(',').map(s => s.trim()).filter(Boolean)
      };
      
      const res = await fetch(`${apiHost}/api/v1/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewPortfolio({ title: '', description: '', client: '', results: '', stack: '' });
        fetchPortfolio();
      }
    } catch (e) {
      alert("Error adding portfolio item");
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm("Delete this portfolio item?")) return;
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/portfolio/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchPortfolio();
    } catch (e) {
      alert("Error deleting portfolio item");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-xs text-slate-400">Loading Portfolio Database...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Portfolio Manager</h1>
          <span className="text-xs text-slate-400">Manage case studies and past work retrieved by the AI.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl glassmorphism flex flex-col h-fit">
          <h3 className="font-semibold text-sm mb-4 border-b border-slate-900 pb-2 flex items-center space-x-2">
            <PlusCircle size={16} className="text-emerald-400" />
            <span>Add Portfolio Case</span>
          </h3>
          <form onSubmit={handleAddPortfolio} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Project Title</label>
              <input
                type="text"
                required
                value={newPortfolio.title}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="e.g. E-Commerce Revamp"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Client Name</label>
              <input
                type="text"
                value={newPortfolio.client}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, client: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="e.g. FitLife Gym"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Tech Stack (comma separated)</label>
              <input
                type="text"
                value={newPortfolio.stack}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, stack: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="e.g. React, Node.js, AWS"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={newPortfolio.description}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                placeholder="What did you build?"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Results/Impact</label>
              <textarea
                rows={2}
                value={newPortfolio.results}
                onChange={(e) => setNewPortfolio(prev => ({ ...prev, results: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                placeholder="e.g. Increased conversion by 40%"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md"
            >
              Save Portfolio Item
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-slate-950/40 border border-slate-900 p-6 rounded-2xl glassmorphism space-y-4">
          <h3 className="font-semibold text-sm border-b border-slate-900 pb-2 flex items-center space-x-2">
            <Briefcase size={16} className="text-emerald-400" />
            <span>Portfolio Cases</span>
          </h3>
          {portfolio.length === 0 ? (
            <p className="text-xs text-slate-500">No portfolio items configured.</p>
          ) : (
            <div className="space-y-4">
              {portfolio.map(item => (
                <div key={item.id} className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex items-start justify-between gap-4">
                  <div className="space-y-1.5 text-left flex-1">
                    <h4 className="font-bold text-sm text-slate-200">{item.title} <span className="font-normal text-xs text-slate-400">for {item.client}</span></h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                    
                    {item.results && (
                      <div className="mt-2 text-[10px] text-emerald-400 font-semibold bg-emerald-950/20 p-2 rounded-lg border border-emerald-900/30">
                        Result: {item.results}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {item.stack && item.stack.map((tech, i) => (
                        <span key={i} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePortfolio(item.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors shrink-0 p-1"
                    title="Delete Case"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
