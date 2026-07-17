'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import type { BrandingConfig, SuggestionCategory } from '@/lib/branding';

interface WelcomeScreenProps {
  branding: BrandingConfig;
  onSelectPrompt: (prompt: string) => void;
  visible: boolean;
}

function WelcomeScreen({ branding, onSelectPrompt, visible }: WelcomeScreenProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center h-full px-4 py-8 relative overflow-hidden"
        >
          {/* Animated background orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div
              className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-[0.04] blur-3xl animate-float"
              style={{ background: 'hsl(var(--brand-primary))' }}
            />
            <div
              className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-[0.03] blur-3xl"
              style={{
                background: 'hsl(var(--brand-secondary))',
                animationDelay: '1.5s',
                animation: 'float 4s ease-in-out infinite',
              }}
            />
            <div
              className="absolute top-1/3 left-1/2 w-48 h-48 rounded-full opacity-[0.02] blur-3xl"
              style={{
                background: 'var(--brand-gradient)',
                animationDelay: '3s',
                animation: 'float 5s ease-in-out infinite',
              }}
            />
          </div>

          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="relative mb-6"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative overflow-hidden"
              style={{
                background: 'var(--brand-gradient)',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            {/* Online status dot */}
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2" style={{ borderColor: 'var(--background)' }}>
              <div className="w-full h-full rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>
          </motion.div>

          {/* Welcome text */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8 max-w-md"
          >
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
              {branding.welcomeTitle}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>
              {branding.welcomeDescription}
            </p>
          </motion.div>

          {/* Suggestion categories */}
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            {branding.suggestedPrompts.map((category, catIdx) => (
              <CategoryCard
                key={category.label}
                category={category}
                index={catIdx}
                onSelect={onSelectPrompt}
              />
            ))}
          </motion.div>

          {/* Powered by footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[11px] mt-8 opacity-40"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Powered by AI
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CategoryCard({
  category,
  index,
  onSelect,
}: {
  category: SuggestionCategory;
  index: number;
  onSelect: (prompt: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.08 }}
      className="rounded-xl p-3 transition-colors duration-200 cursor-default group"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-xs font-semibold mb-2 flex items-center gap-1.5"
        style={{ color: 'var(--foreground-muted)' }}
      >
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px]"
          style={{ background: 'hsla(var(--brand-primary), 0.1)', color: 'hsl(var(--brand-primary))' }}
        >
          {category.icon === 'globe' ? '🌐' : category.icon === 'bot' ? '🤖' : category.icon === 'credit-card' ? '💳' : '📁'}
        </span>
        {category.label}
      </p>
      <div className="flex flex-col gap-1.5">
        {category.prompts.slice(0, 3).map((prompt) => (
          <motion.button
            key={prompt}
            whileHover={{ scale: 1.01, x: 2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(prompt)}
            className="text-left text-xs px-2.5 py-1.5 rounded-lg transition-colors duration-200 truncate"
            style={{
              color: 'var(--foreground)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsla(var(--brand-primary), 0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            aria-label={`Ask: ${prompt}`}
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

export default React.memo(WelcomeScreen);
