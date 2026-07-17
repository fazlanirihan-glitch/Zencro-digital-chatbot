'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle, PlusCircle, Trash2 } from 'lucide-react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FAQManager() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'Web Development' });

  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiHost}/api/v1/faqs`);
      if (res.ok) {
        const data = await res.json();
        setFaqs(data.data || data);
      }
    } catch (e) {
      console.error("Error fetching FAQs:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/faqs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newFaq)
      });
      if (res.ok) {
        setNewFaq({ question: '', answer: '', category: 'Web Development' });
        fetchFaqs();
      }
    } catch (e) {
      alert("Error adding FAQ");
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    if (!confirm("Delete this FAQ?")) return;
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/faqs/${faqId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFaqs();
    } catch (e) {
      alert("Error deleting FAQ");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-xs text-slate-400">Loading FAQ Database...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">FAQ Manager</h1>
          <span className="text-xs text-slate-400">Manage Frequently Asked Questions retrieved by the AI.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-slate-950/40 border border-slate-900 p-6 rounded-2xl glassmorphism flex flex-col h-fit">
          <h3 className="font-semibold text-sm mb-4 border-b border-slate-900 pb-2 flex items-center space-x-2">
            <PlusCircle size={16} className="text-blue-400" />
            <span>Create New FAQ</span>
          </h3>
          <form onSubmit={handleAddFaq} className="space-y-4 text-left">
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Question Text</label>
              <input
                type="text"
                required
                value={newFaq.question}
                onChange={(e) => setNewFaq(prev => ({ ...prev, question: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="e.g. Do you support multi-language?"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Answer Text</label>
              <textarea
                required
                rows={4}
                value={newFaq.answer}
                onChange={(e) => setNewFaq(prev => ({ ...prev, answer: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                placeholder="e.g. Yes, we plan to support Hindi..."
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 font-medium mb-1">Category</label>
              <select
                value={newFaq.category}
                onChange={(e) => setNewFaq(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Web Development">Web Development</option>
                <option value="AI Automations">AI Automations</option>
                <option value="Pricing">Pricing</option>
                <option value="General">General</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-all shadow-md"
            >
              Save to Database
            </button>
          </form>
        </div>

        {/* List */}
        <div className="md:col-span-2 bg-slate-950/40 border border-slate-900 p-6 rounded-2xl glassmorphism space-y-4">
          <h3 className="font-semibold text-sm border-b border-slate-900 pb-2 flex items-center space-x-2">
            <HelpCircle size={16} className="text-indigo-400" />
            <span>Active FAQs</span>
          </h3>
          {faqs.length === 0 ? (
            <p className="text-xs text-slate-500">No FAQs configured.</p>
          ) : (
            <div className="space-y-4">
              {faqs.map(faq => (
                <div key={faq.id} className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl flex items-start justify-between gap-4">
                  <div className="space-y-1.5 text-left flex-1">
                    <span className="text-[9px] bg-indigo-950/50 border border-indigo-900/40 text-indigo-400 font-semibold px-2 py-0.5 rounded-full">
                      {faq.category}
                    </span>
                    <h4 className="font-bold text-xs text-slate-200 mt-1">{faq.question}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors shrink-0"
                    title="Delete FAQ"
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
