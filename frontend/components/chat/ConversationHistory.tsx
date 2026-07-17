'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Plus, MessageSquare, Trash2, Clock,
} from 'lucide-react';

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  messageCount: number;
}

interface ConversationHistoryProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
}

function ConversationHistory({
  conversations,
  activeId,
  isOpen,
  onClose,
  onSelect,
  onNewChat,
  onDelete,
}: ConversationHistoryProps) {
  const grouped = useMemo(() => {
    const now = new Date();
    const today: ConversationSummary[] = [];
    const week: ConversationSummary[] = [];
    const older: ConversationSummary[] = [];

    conversations.forEach((c) => {
      const d = new Date(c.timestamp);
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      if (diff < 1) today.push(c);
      else if (diff < 7) week.push(c);
      else older.push(c);
    });

    return [
      { label: 'Today', items: today },
      { label: 'This Week', items: week },
      { label: 'Older', items: older },
    ].filter((g) => g.items.length > 0);
  }, [conversations]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 z-10"
            style={{ background: 'rgba(0, 0, 0, 0.3)' }}
            aria-hidden="true"
          />

          {/* Sidebar panel */}
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute left-0 top-0 bottom-0 w-[280px] z-20 flex flex-col overflow-hidden"
            style={{
              background: 'var(--background-secondary)',
              borderRight: '1px solid var(--border)',
            }}
            role="dialog"
            aria-label="Conversation history"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                Conversations
              </h3>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNewChat}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'hsla(var(--brand-primary), 0.1)' }}
                  aria-label="Start new chat"
                >
                  <Plus className="w-3.5 h-3.5" style={{ color: 'hsl(var(--brand-primary))' }} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                  style={{ color: 'var(--foreground-muted)' }}
                  aria-label="Close conversation list"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto chat-scroll px-2 py-2">
              {grouped.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <MessageSquare className="w-8 h-8 opacity-20" style={{ color: 'var(--foreground-muted)' }} />
                  <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                    No conversations yet
                  </p>
                </div>
              ) : (
                grouped.map((group) => (
                  <div key={group.label} className="mb-3">
                    <p
                      className="text-[10px] font-medium uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1"
                      style={{ color: 'var(--foreground-muted)', opacity: 0.6 }}
                    >
                      <Clock className="w-2.5 h-2.5" />
                      {group.label}
                    </p>
                    {group.items.map((conversation) => (
                      <motion.button
                        key={conversation.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(conversation.id)}
                        className="w-full text-left rounded-lg px-3 py-2 mb-0.5 group flex items-start gap-2 transition-colors relative"
                        style={{
                          background: activeId === conversation.id ? 'hsla(var(--brand-primary), 0.08)' : 'transparent',
                          color: 'var(--foreground)',
                        }}
                        onMouseEnter={(e) => {
                          if (activeId !== conversation.id) {
                            e.currentTarget.style.background = 'var(--surface-hover)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (activeId !== conversation.id) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                        aria-label={`Open conversation: ${conversation.title}`}
                        aria-current={activeId === conversation.id ? 'true' : undefined}
                      >
                        <MessageSquare
                          className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-40"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">
                            {conversation.title}
                          </p>
                          <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                            {conversation.lastMessage}
                          </p>
                        </div>
                        {/* Delete button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(conversation.id);
                          }}
                          className="opacity-0 group-hover:opacity-60 hover:!opacity-100 w-5 h-5 rounded flex items-center justify-center shrink-0 transition-opacity"
                          style={{ color: 'var(--foreground-muted)' }}
                          aria-label={`Delete conversation: ${conversation.title}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </motion.button>
                      </motion.button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default React.memo(ConversationHistory);
