'use client';

import React, { useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Pencil,
  Sparkles,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ChatBubbleProps {
  /** The message text (plain text for user, markdown for bot) */
  message: string;
  /** Who sent the message */
  sender: 'user' | 'bot';
  /** Optional ISO or display timestamp */
  timestamp?: string;
  /** Optional source URLs / labels shown as pill badges (bot only) */
  sources?: string[];
  /** When true a blinking cursor is rendered at the end of the message */
  isStreaming?: boolean;
  /** Called when the user copies the message */
  onCopy?: (message: string) => void;
  /** Called when the user requests the bot to regenerate (bot only) */
  onRegenerate?: () => void;
  /** Positive‑feedback callback (bot only) */
  onLike?: () => void;
  /** Negative‑feedback callback (bot only) */
  onDislike?: () => void;
  /** Edit callback (user messages only) */
  onEdit?: (message: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Small reusable icon‑button used in the action bar                  */
/* ------------------------------------------------------------------ */

interface ActionBtnProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

const ActionBtn: React.FC<ActionBtnProps> = ({ label, onClick, children }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    onClick={onClick}
    className="flex items-center justify-center w-7 h-7 rounded-md
               bg-[var(--surface)] hover:bg-[var(--surface-hover)]
               border border-[var(--border)] hover:border-[var(--border-hover)]
               text-[var(--foreground-muted)] hover:text-[var(--foreground)]
               transition-colors duration-150 cursor-pointer"
  >
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/*  Streaming cursor                                                   */
/* ------------------------------------------------------------------ */

const StreamingCursor: React.FC = () => (
  <span
    className="inline-block w-[2px] h-[1em] ml-0.5 align-middle
               bg-[var(--foreground)] animate-pulse rounded-full"
    aria-hidden="true"
  />
);

/* ------------------------------------------------------------------ */
/*  ChatBubble component                                               */
/* ------------------------------------------------------------------ */

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  sender,
  timestamp,
  sources,
  isStreaming = false,
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  onEdit,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isUser = sender === 'user';
  const isBot = sender === 'bot';

  /* ---- copy handler ---- */
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message).then(() => {
      setCopied(true);
      onCopy?.(message);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [message, onCopy]);

  /* ---- motion variants ---- */
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 6 } as const,
        animate: { opacity: 1, y: 0 } as const,
        transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } as const,
      };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <motion.div
      {...motionProps}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ---- Bot avatar ---- */}
      {isBot && (
        <div
          className="flex-shrink-0 mt-1 mr-2.5 flex items-center justify-center
                     w-8 h-8 rounded-full
                     bg-[var(--glass-bg)] border border-[var(--glass-border)]
                     text-[var(--foreground-muted)]"
          aria-hidden="true"
        >
          <Sparkles size={14} />
        </div>
      )}

      {/* ---- Bubble column ---- */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* ---- Bubble ---- */}
        <div
          className={`
            relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-[var(--shadow-sm)]
            ${
              isUser
                ? 'bg-[var(--bubble-user)] text-[var(--bubble-user-text)] rounded-tr-sm'
                : 'bg-[var(--bubble-bot)] text-[var(--bubble-bot-text)] border border-[var(--border)] rounded-tl-sm'
            }
          `}
        >
          {/* -- Message content -- */}
          {isBot ? (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
              {isStreaming && <StreamingCursor />}
            </div>
          ) : (
            <p className="whitespace-pre-wrap">
              {message}
              {isStreaming && <StreamingCursor />}
            </p>
          )}
        </div>

        {/* ---- Source pill badges (bot only) ---- */}
        {isBot && sources && sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5 px-1" role="list" aria-label="Sources">
            {sources.map((src) => (
              <span
                key={src}
                role="listitem"
                className="inline-flex items-center text-[10px] font-medium
                           px-2 py-0.5 rounded-full
                           bg-[var(--surface)] border border-[var(--border)]
                           text-[var(--foreground-muted)]"
              >
                {src}
              </span>
            ))}
          </div>
        )}

        {/* ---- Action bar (visible on hover) ---- */}
        {isHovered && !isStreaming && (
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 2 }}
            animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`flex items-center gap-1 mt-1 px-1 ${isUser ? 'flex-row-reverse' : ''}`}
          >
            {/* Bot actions */}
            {isBot && (
              <>
                <ActionBtn
                  label={copied ? 'Copied!' : 'Copy message'}
                  onClick={handleCopy}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </ActionBtn>

                {onLike && (
                  <ActionBtn label="Like response" onClick={onLike}>
                    <ThumbsUp size={14} />
                  </ActionBtn>
                )}

                {onDislike && (
                  <ActionBtn label="Dislike response" onClick={onDislike}>
                    <ThumbsDown size={14} />
                  </ActionBtn>
                )}

                {onRegenerate && (
                  <ActionBtn label="Regenerate response" onClick={onRegenerate}>
                    <RefreshCw size={14} />
                  </ActionBtn>
                )}
              </>
            )}

            {/* User actions */}
            {isUser && onEdit && (
              <ActionBtn label="Edit message" onClick={() => onEdit(message)}>
                <Pencil size={14} />
              </ActionBtn>
            )}
          </motion.div>
        )}

        {/* ---- Timestamp ---- */}
        {timestamp && (
          <span
            className="mt-1 px-1 text-[10px] leading-none
                       text-[var(--foreground-muted)] select-none"
          >
            {timestamp}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default React.memo(ChatBubble);
