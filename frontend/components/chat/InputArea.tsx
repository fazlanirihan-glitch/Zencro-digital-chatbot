'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Send, Square, Paperclip, Mic } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface InputAreaProps {
  /** Callback fired when the user submits a message */
  onSend: (message: string) => void;
  /** When true the entire input area is disabled */
  disabled: boolean;
  /** When true the AI is actively generating – shows a stop button */
  isGenerating?: boolean;
  /** Callback fired when the user clicks the stop button */
  onStopGeneration?: () => void;
  /** Textarea placeholder text */
  placeholder?: string;
}

/* ------------------------------------------------------------------ */
/*  Tooltip wrapper (lightweight, accessible)                          */
/* ------------------------------------------------------------------ */

function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap
                   rounded-md px-2 py-1 text-[11px] font-medium
                   opacity-0 transition-opacity group-hover/tip:opacity-100
                   z-10"
        style={{
          background: 'var(--surface)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {label}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Action button (circular, brand gradient)                           */
/* ------------------------------------------------------------------ */

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  children: React.ReactNode;
  /** Framer Motion layout key for AnimatePresence swap */
  motionKey: string;
  reducedMotion: boolean | null;
}

function ActionButton({
  onClick,
  disabled = false,
  ariaLabel,
  children,
  motionKey,
  reducedMotion,
}: ActionButtonProps) {
  return (
    <motion.button
      key={motionKey}
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      initial={reducedMotion ? false : { opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      whileHover={reducedMotion ? undefined : { scale: 1.1 }}
      whileTap={reducedMotion ? undefined : { scale: 0.92 }}
      className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full
                 text-white transition-shadow disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: 'var(--brand-gradient)',
      }}
    >
      {children}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  InputArea component                                                */
/* ------------------------------------------------------------------ */

const InputArea = React.memo(function InputArea({
  onSend,
  disabled,
  isGenerating = false,
  onStopGeneration,
  placeholder = 'Type a message…',
}: InputAreaProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefersReducedMotion = useReducedMotion();

  /* ---- Handlers ---- */

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    // Re-focus after send so the user can keep typing
    requestAnimationFrame(() => textareaRef.current?.focus());
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!disabled && !isGenerating) {
          handleSend();
        }
      }
    },
    [disabled, isGenerating, handleSend],
  );

  const handleStopGeneration = useCallback(() => {
    onStopGeneration?.();
  }, [onStopGeneration]);

  const isEmpty = value.trim().length === 0;

  /* ---- Render ---- */

  return (
    <div
      className="rounded-2xl p-1 transition-shadow duration-200 focus-within:shadow-[0_0_0_2px_var(--input-focus)]"
      style={{
        background: 'var(--input-bg)',
        border: '1px solid var(--input-border)',
      }}
    >
      {/* Inner flex row */}
      <div className="flex items-end gap-1">
        {/* ---- Accessory buttons (left side) ---- */}
        <div className="flex items-center gap-0.5 pb-1 pl-1">
          <Tooltip label="Coming soon">
            <button
              type="button"
              disabled
              aria-label="Attach file (coming soon)"
              className="flex h-8 w-8 items-center justify-center rounded-lg
                         transition-colors disabled:cursor-default"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <Paperclip size={18} />
            </button>
          </Tooltip>

          <Tooltip label="Coming soon">
            <button
              type="button"
              disabled
              aria-label="Voice input (coming soon)"
              className="flex h-8 w-8 items-center justify-center rounded-lg
                         transition-colors disabled:cursor-default"
              style={{ color: 'var(--foreground-muted)' }}
            >
              <Mic size={18} />
            </button>
          </Tooltip>
        </div>

        {/* ---- Textarea ---- */}
        <TextareaAutosize
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          minRows={1}
          maxRows={5}
          aria-label="Chat message input"
          className="flex-1 resize-none bg-transparent py-2 pr-1 text-sm leading-relaxed
                     outline-none placeholder:select-none"
          style={{
            color: 'var(--foreground)',
            caretColor: 'var(--input-focus)',
          }}
        />

        {/* ---- Send / Stop button (right side) ---- */}
        <div className="flex items-center pb-1 pr-1">
          <AnimatePresence mode="wait" initial={false}>
            {isGenerating ? (
              <ActionButton
                key="stop"
                motionKey="stop"
                onClick={handleStopGeneration}
                ariaLabel="Stop generation"
                reducedMotion={prefersReducedMotion}
              >
                <Square size={16} fill="currentColor" />
              </ActionButton>
            ) : (
              <ActionButton
                key="send"
                motionKey="send"
                onClick={handleSend}
                disabled={disabled || isEmpty}
                ariaLabel="Send message"
                reducedMotion={prefersReducedMotion}
              >
                <Send size={16} />
              </ActionButton>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
});

export default InputArea;
