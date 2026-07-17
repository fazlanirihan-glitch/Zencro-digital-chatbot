'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle, PhoneCall, Clock, CheckCircle2, Download, Terminal } from 'lucide-react';

interface ChatSession {
  id: string;
  session_id: string;
  user_message: string;
  assistant_message: string;
  retrieved_sources: string;
  model_used: string;
  response_time: number;
  token_usage: number;
  created_at: string;
}

export default function ConversationExplorer() {
  const [sessions, setSessions] = useState<{session_id: string, message_count: number, latest: string, date: string, needs_human: boolean}[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const apiHost = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/admin/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Assume API groups them by session, or we group them here.
        // If the backend returns all rows, we group them on the frontend for now.
        const data = await res.json();
        const rows: ChatSession[] = data.data || data;
        
        const grouped = new Map<string, {session_id: string, message_count: number, latest: string, date: string, needs_human: boolean}>();
        rows.forEach(r => {
          if (!grouped.has(r.session_id)) {
            grouped.set(r.session_id, {
              session_id: r.session_id,
              message_count: 0,
              latest: r.user_message,
              date: r.created_at,
              needs_human: false
            });
          }
          const g = grouped.get(r.session_id);
          g.message_count += 1;
          if (new Date(r.created_at) > new Date(g.date)) {
            g.latest = r.user_message;
            g.date = r.created_at;
          }
          if (r.assistant_message.toLowerCase().includes('support') || r.assistant_message.toLowerCase().includes('human')) {
            g.needs_human = true;
          }
        });
        
        setSessions(Array.from(grouped.values()).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchChatMessages = async (sessId: string) => {
    try {
      const token = localStorage.getItem('zencro_admin_token');
      const res = await fetch(`${apiHost}/api/v1/admin/conversations/${sessId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.data || data);
      }
    } catch (e) {
      console.error("Error loading chat messages:", e);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      fetchChatMessages(selectedSessionId);
    }
  }, [selectedSessionId]);

  const exportConversation = () => {
    if (chatMessages.length === 0) return;
    
    let text = `Exported Conversation Transcript: ${selectedSessionId}\n`;
    text += `Date: ${new Date().toISOString()}\n\n`;
    
    chatMessages.forEach((msg, i) => {
      text += `--- Turn ${i+1} ---\n`;
      text += `User: ${msg.user_message}\n`;
      text += `AI [${msg.model_used}] (${msg.response_time}ms): ${msg.assistant_message}\n\n`;
      if (msg.retrieved_sources && msg.retrieved_sources !== '[]') {
        text += `[Sources Used: ${msg.retrieved_sources}]\n\n`;
      }
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript_${selectedSessionId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <span className="text-xs text-slate-400">Loading Audits...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col h-screen max-h-screen space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between border-b border-slate-900 pb-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Conversation Explorer</h1>
          <span className="text-xs text-slate-400">Replay chats, view RAG sources, and audit AI latency.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Session List */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl glassmorphism overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-slate-900 bg-slate-900/30 flex justify-between">
            <h3 className="font-semibold text-xs text-slate-200">Session History</h3>
            <span className="text-[10px] text-slate-500">{sessions.length} sessions</span>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-900/50">
            {sessions.length === 0 ? (
              <p className="p-4 text-xs text-slate-500 text-center">No chat conversations recorded.</p>
            ) : (
              sessions.map(sess => (
                <button
                  key={sess.session_id}
                  onClick={() => setSelectedSessionId(sess.session_id)}
                  className={`w-full text-left p-4 hover:bg-slate-900/30 transition-all flex items-start justify-between ${selectedSessionId === sess.session_id ? 'bg-blue-900/10 border-l-2 border-blue-500' : ''}`}
                >
                  <div className="max-w-[70%]">
                    <div className="text-[10px] font-mono text-slate-300 truncate">{sess.session_id}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-1">{sess.latest || 'Empty chat'}</div>
                    <span className="text-[9px] text-slate-400 block mt-2">{new Date(sess.date).toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    {sess.needs_human && (
                      <span className="px-2 py-0.5 bg-red-950/50 border border-red-900/40 text-[9px] text-red-400 rounded-full font-semibold animate-pulse flex items-center space-x-1">
                        <AlertCircle size={8} />
                        <span>Escalation</span>
                      </span>
                    )}
                    <span className="text-[9px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-full text-slate-400">
                      {sess.message_count} turns
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Transcript Viewer */}
        <div className="md:col-span-2 bg-slate-950/40 border border-slate-900 rounded-2xl glassmorphism overflow-hidden flex flex-col h-full">
          {selectedSessionId ? (
            <>
              {/* Transcript Header */}
              <div className="p-4 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Transcript</span>
                  <span className="text-[10px] font-mono text-slate-500">{selectedSessionId}</span>
                </div>
                <button 
                  onClick={exportConversation}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-medium text-[10px] px-3 py-1.5 rounded-lg flex items-center space-x-2 transition-all"
                >
                  <Download size={12} />
                  <span>Export Chat</span>
                </button>
              </div>

              {/* Chat Flow */}
              <div className="flex-1 p-6 overflow-y-auto space-y-8">
                {chatMessages.map((msg, i) => (
                  <div key={msg.id || i} className="space-y-4">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed bg-blue-600 text-white rounded-tr-none">
                        <p className="whitespace-pre-wrap">{msg.user_message}</p>
                        <span className="text-[8px] text-blue-200 block mt-2 text-right">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* AI Message */}
                    <div className="flex justify-start flex-col space-y-1">
                      <div className="max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none">
                        <p className="whitespace-pre-wrap">{msg.assistant_message}</p>
                      </div>
                      
                      {/* AI Audit Metadata Footer */}
                      <div className="flex items-center space-x-3 mt-1 ml-1">
                        <span className="text-[9px] text-slate-500 flex items-center space-x-1" title="Model Used">
                          <Terminal size={10} />
                          <span>{msg.model_used}</span>
                        </span>
                        <span className="text-[9px] text-slate-500 flex items-center space-x-1" title="Response Latency">
                          <Clock size={10} />
                          <span className={msg.response_time > 3000 ? 'text-red-400' : 'text-green-400'}>{msg.response_time}ms</span>
                        </span>
                        {msg.token_usage > 0 && (
                          <span className="text-[9px] text-slate-500">
                            Tokens: {msg.token_usage}
                          </span>
                        )}
                        {msg.retrieved_sources && msg.retrieved_sources !== '[]' && (
                          <span className="text-[9px] text-slate-500 flex items-center space-x-1 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            <CheckCircle2 size={10} className="text-blue-500" />
                            <span>RAG Sources Applied</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500">
              <MessageSquare size={36} className="mb-3 text-slate-700" />
              <p className="text-xs">Select a session to audit the AI responses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
