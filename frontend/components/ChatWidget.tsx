'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  MessageSquare, X, Maximize2, Minimize2, Menu, Sparkles,
} from 'lucide-react';
import ChatBubble from './chat/ChatBubble';
import TypingIndicator, { AIStatus } from './chat/TypingIndicator';
import InputArea from './chat/InputArea';
import WelcomeScreen from './chat/WelcomeScreen';
import LeadCard, { LeadData } from './chat/LeadCard';
import ErrorState from './chat/ErrorState';
import ConversationHistory, { ConversationSummary } from './chat/ConversationHistory';
import ScrollToBottom from './chat/ScrollToBottom';
import { getBranding, applyBrandingTheme, BrandingConfig } from '@/lib/branding';
import { chatClient } from '@/lib/ChatClient';

// ---------- Types ----------
interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  message: string;
  timestamp: string;
  sources?: string[];
  isStreaming?: boolean;
  error?: 'network' | 'timeout' | 'server' | 'unknown';
  showLeadCard?: boolean;
  liked?: boolean;
  disliked?: boolean;
}

interface ConversationState {
  id: string;
  messages: ChatMessage[];
  sessionId: string;
  suggestions?: string[];
}

// ---------- Constants ----------
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const STORAGE_KEY = 'zencro-chat-conversations';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---------- LocalStorage Helpers ----------
function loadConversations(): ConversationState[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convos: ConversationState[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos.slice(0, 50)));
  } catch { /* storage full */ }
}

// ========================================
// MAIN CHAT WIDGET
// ========================================
export default function ChatWidget() {
  const branding: BrandingConfig = getBranding();
  const prefersReducedMotion = useReducedMotion();

  // --- Widget state ---
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(true);

  // --- Conversation state ---
  const [conversations, setConversations] = useState<ConversationState[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  // --- Scroll ---
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // --- Abort controller ---
  const abortRef = useRef<AbortController | null>(null);

  // Initialize branding theme
  useEffect(() => {
    applyBrandingTheme(branding);
  }, [branding]);

  useEffect(() => {
    const saved = loadConversations();
    setTimeout(() => setConversations(saved), 0);
  }, []);

  // Check backend health on startup
  useEffect(() => {
    fetch(`${API_BASE}/api/v1/health`)
      .then((res) => {
        setBackendHealthy(res.ok);
      })
      .catch(() => {
        setBackendHealthy(false);
      });
  }, []);

  // Active conversation memo
  const activeConvo = useMemo(
    () => conversations.find((c) => c.id === activeConvoId) || null,
    [conversations, activeConvoId]
  );

  const messages = activeConvo?.messages || [];
  const dynamicSuggestions = activeConvo?.suggestions || [];
  const hasMessages = messages.length > 0;

  // Save on change
  useEffect(() => {
    if (conversations.length > 0) {
      saveConversations(conversations);
    }
  }, [conversations]);

  // Auto scroll
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (isOpen && hasMessages) {
      scrollToBottom();
    }
  }, [messages.length, isOpen, hasMessages, scrollToBottom, aiStatus]);

  // Scroll detection
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 120);
  }, []);

  // Fullscreen on mobile
  useEffect(() => {
    const check = () => {
      if (window.innerWidth < 640 && isOpen) {
        setIsFullscreen(true);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [isOpen]);

  // --- Helpers ---
  const createNewConversation = useCallback((): string => {
    const newConvo: ConversationState = {
      id: generateId(),
      messages: [],
      sessionId: generateId(),
      suggestions: [],
    };
    setConversations((prev) => [newConvo, ...prev]);
    setActiveConvoId(newConvo.id);
    return newConvo.id;
  }, []);

  const updateMessages = useCallback(
    (convoId: string, updater: (msgs: ChatMessage[]) => ChatMessage[]) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, messages: updater(c.messages) } : c))
      );
    },
    []
  );

  const updateConversation = useCallback(
    (convoId: string, updates: Partial<ConversationState>) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === convoId ? { ...c, ...updates } : c))
      );
    },
    []
  );

  // --- Core send ---
  const handleSend = useCallback(
    async (text: string, isRetry = false) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      let convoId = activeConvoId;
      let sessionId = activeConvo?.sessionId;

      if (!convoId) {
        convoId = createNewConversation();
        sessionId = convoId;
      }

      const botPlaceholderId = generateId();

      // Only add user message if this is a fresh send, not a silent retry
      if (!isRetry) {
        const userMsg: ChatMessage = {
          id: generateId(),
          sender: 'user',
          message: trimmed,
          timestamp: formatTime(),
        };

        const botPlaceholder: ChatMessage = {
          id: botPlaceholderId,
          sender: 'bot',
          message: '',
          timestamp: formatTime(),
          isStreaming: true,
        };

        updateMessages(convoId, (msgs) => [...msgs, userMsg, botPlaceholder]);
      } else {
        // Retry logic: add a new placeholder at the end
        updateMessages(convoId, (msgs) => [
          ...msgs,
          {
            id: botPlaceholderId,
            sender: 'bot',
            message: '',
            timestamp: formatTime(),
            isStreaming: true,
          }
        ]);
      }

      setAiStatus('understanding');
      setTimeout(() => {
        if (aiStatus === 'understanding') setAiStatus('thinking');
      }, 800);

      const controller = new AbortController();
      abortRef.current = controller;

      // Event Tracking
      console.log(`Analytics: MessageSent [Session: ${sessionId}]`);

      try {
        let firstChunkReceived = false;

        await chatClient.sendMessage(
          trimmed,
          sessionId!,
          (chunk) => {
            // On first chunk, transition to generating state
            if (!firstChunkReceived) {
              firstChunkReceived = true;
              setAiStatus('generating');
            }
            updateMessages(convoId, (msgs) =>
              msgs.map((m) =>
                m.id === botPlaceholderId
                  ? { ...m, message: m.message + chunk }
                  : m
              )
            );
          },
          (metadata) => {
            // Complete! Remove streaming flag and update metadata
            updateMessages(convoId, (msgs) =>
              msgs.map((m) =>
                m.id === botPlaceholderId
                  ? {
                      ...m,
                      sources: metadata.sources,
                      showLeadCard: metadata.lead_detected,
                      isStreaming: false,
                    }
                  : m
              )
            );

            // Update dynamic suggestions globally for this conversation
            if (metadata.suggestions && Array.isArray(metadata.suggestions)) {
              updateConversation(convoId, { suggestions: metadata.suggestions });
            }

            if (metadata.lead_detected) {
               console.log(`Analytics: LeadDetected [Session: ${sessionId}]`);
            }
          },
          (error) => {
            throw error;
          },
          controller.signal
        );
      } catch (err: unknown) {
        const isAbort = err instanceof DOMException && err.name === 'AbortError';
        if (isAbort) {
          updateMessages(convoId, (msgs) =>
            msgs.map((m) =>
              m.id === botPlaceholderId
                ? { ...m, message: m.message + ' (Stopped)', isStreaming: false }
                : m
            )
          );
        } else {
          console.error("API Error:", err);
          const errorType = !navigator.onLine ? 'network' : 'server';
          updateMessages(convoId, (msgs) =>
            msgs.map((m) =>
              m.id === botPlaceholderId
                ? { ...m, message: '', isStreaming: false, error: errorType }
                : m
            )
          );
        }
      } finally {
        setAiStatus(null);
        abortRef.current = null;
      }
    },
    [activeConvoId, activeConvo?.sessionId, createNewConversation, updateMessages, updateConversation, aiStatus]
  );

  // --- Handlers ---
  const handleStopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRetry = useCallback(
    (messageId: string) => {
      if (!activeConvoId) return;
      const convo = conversations.find((c) => c.id === activeConvoId);
      if (!convo) return;
      const errorIdx = convo.messages.findIndex((m) => m.id === messageId);
      if (errorIdx < 1) return;
      const userMsg = convo.messages[errorIdx - 1];
      if (userMsg?.sender === 'user') {
        updateMessages(activeConvoId, (msgs) => msgs.filter((m) => m.id !== messageId));
        handleSend(userMsg.message, true);
      }
    },
    [activeConvoId, conversations, updateMessages, handleSend]
  );

  const handleLeadComplete = useCallback(
    async (leadData: LeadData) => {
      console.log(`Analytics: LeadSubmitted`, leadData);
      try {
        await fetch(`${API_BASE}/api/v1/leads`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData),
        });
      } catch { /* silent */ }
    },
    []
  );

  const handleNewChat = useCallback(() => {
    createNewConversation();
    setShowHistory(false);
  }, [createNewConversation]);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvoId === id) {
        setActiveConvoId(null);
      }
    },
    [activeConvoId]
  );

  // --- Open widget ---
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    console.log(`Analytics: ChatOpened`);
  }, []);

  // Conversation summaries for sidebar
  const conversationSummaries: ConversationSummary[] = useMemo(
    () =>
      conversations.map((c) => ({
        id: c.id,
        title: c.messages[0]?.message.slice(0, 40) || 'New Chat',
        lastMessage: c.messages[c.messages.length - 1]?.message.slice(0, 60) || '',
        timestamp: new Date().toISOString(),
        messageCount: c.messages.length,
      })),
    [conversations]
  );

  // ========================================
  // RENDER
  // ========================================
  return (
    <>
      {/* ===== FLOATING BUTTON ===== */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl flex items-center justify-center text-white group"
            style={{
              background: 'var(--brand-gradient)',
              boxShadow: 'var(--shadow-glow)',
            }}
            aria-label={`Open ${branding.companyName} chat`}
          >
            <MessageSquare className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
              style={{
                background: 'var(--brand-gradient)',
                animation: 'pulseRing 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
              aria-hidden="true"
            />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ===== CHAT WINDOW ===== */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={`fixed z-50 flex flex-col overflow-hidden ${
              isFullscreen
                ? 'inset-0 rounded-none'
                : 'bottom-6 right-6 w-[400px] h-[600px] max-h-[85vh] rounded-2xl'
            }`}
            style={{
              background: 'var(--background)',
              border: isFullscreen ? 'none' : '1px solid var(--border)',
              boxShadow: isFullscreen ? 'none' : 'var(--shadow-lg)',
            }}
            role="dialog"
            aria-label={`${branding.companyName} AI Assistant`}
          >
            {/* ===== HEADER ===== */}
            <div
              className="flex items-center gap-3 px-4 py-3 shrink-0 relative"
              style={{
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHistory(!showHistory)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                style={{ color: 'var(--foreground-muted)' }}
                aria-label="Toggle conversation history"
              >
                <Menu className="w-4 h-4" />
              </motion.button>

              {/* Avatar + Info */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--brand-gradient)' }}
              >
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                  {branding.companyName}
                </h2>
                <p className="text-[10px] flex items-center gap-1" style={{ color: 'var(--foreground-muted)' }}>
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${backendHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  {backendHealthy ? 'Always online' : 'System Offline'}
                </p>
              </div>

              {/* Window controls */}
              <div className="flex items-center gap-0.5">
                {!isFullscreen && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFullscreen(true)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--foreground-muted)' }}
                    aria-label="Maximize chat"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </motion.button>
                )}
                {isFullscreen && window.innerWidth >= 640 && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsFullscreen(false)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ color: 'var(--foreground-muted)' }}
                    aria-label="Minimize chat"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setIsOpen(false);
                    setIsFullscreen(false);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ color: 'var(--foreground-muted)' }}
                  aria-label="Close chat"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            {/* ===== BODY ===== */}
            <div className="flex-1 relative overflow-hidden">
              <ConversationHistory
                conversations={conversationSummaries}
                activeId={activeConvoId}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onSelect={(id) => {
                  setActiveConvoId(id);
                  setShowHistory(false);
                }}
                onNewChat={handleNewChat}
                onDelete={handleDeleteConversation}
              />

              {/* Messages area */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto chat-scroll px-4 py-4"
              >
                {!hasMessages ? (
                  <WelcomeScreen
                    branding={branding}
                    onSelectPrompt={(prompt) => {
                      if (!activeConvoId) createNewConversation();
                      handleSend(prompt);
                    }}
                    visible={!hasMessages}
                  />
                ) : (
                  <>
                    {messages.map((msg, idx) => (
                      <React.Fragment key={msg.id}>
                        {msg.error ? (
                          <ErrorState
                            type={msg.error}
                            onRetry={() => handleRetry(msg.id)}
                          />
                        ) : (
                          <ChatBubble
                            message={msg.message}
                            sender={msg.sender}
                            timestamp={msg.timestamp}
                            sources={msg.sources}
                            isStreaming={msg.isStreaming}
                            onCopy={() => {}}
                            onRegenerate={() => {}}
                            onLike={() => {}}
                            onDislike={() => {}}
                            onEdit={undefined}
                          />
                        )}
                        {msg.showLeadCard && (
                          <LeadCard
                            onComplete={handleLeadComplete}
                            onSkip={() => {}}
                          />
                        )}
                        
                        {/* Show dynamic suggestions after the LAST completed bot message */}
                        {msg.sender === 'bot' && !msg.error && !msg.isStreaming && idx === messages.length - 1 && dynamicSuggestions.length > 0 && !aiStatus && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-wrap gap-2 mt-3 mb-2"
                          >
                            {dynamicSuggestions.map((sugg, i) => (
                              <button
                                key={i}
                                onClick={() => handleSend(sugg)}
                                className="text-xs px-3 py-1.5 rounded-full transition-colors font-medium border"
                                style={{
                                  background: 'var(--surface)',
                                  borderColor: 'var(--brand-primary)',
                                  color: 'var(--foreground)'
                                }}
                              >
                                {sugg}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </React.Fragment>
                    ))}
                    {aiStatus && (
                      <TypingIndicator status={aiStatus} />
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <ScrollToBottom
                visible={showScrollBtn && hasMessages}
                onClick={scrollToBottom}
              />
            </div>

            {/* ===== INPUT AREA ===== */}
            <div
              className="px-3 py-2.5 shrink-0"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <InputArea
                onSend={handleSend}
                disabled={aiStatus !== null}
                isGenerating={aiStatus !== null}
                onStopGeneration={handleStopGeneration}
                placeholder={`Message ${branding.companyName}...`}
              />
              <p
                className="text-[10px] text-center mt-1.5 opacity-40"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Powered by {branding.companyName} AI
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
