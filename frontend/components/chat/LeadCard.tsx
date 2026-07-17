'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Building2, FileText, ArrowRight, Check } from 'lucide-react';

interface LeadCardProps {
  onComplete: (leadData: LeadData) => void;
  onSkip?: () => void;
}

export interface LeadData {
  name: string;
  email: string;
  phone: string;
  business_name: string;
  requirements: string;
}

const steps = [
  { key: 'name', question: "What should I call you?", icon: User, placeholder: "Your name", type: "text" },
  { key: 'business_name', question: "Great! What's your business called?", icon: Building2, placeholder: "Business name", type: "text" },
  { key: 'phone', question: "What's the best number to reach you?", icon: Phone, placeholder: "+91 98765 43210", type: "tel" },
  { key: 'email', question: "And your email address?", icon: Mail, placeholder: "you@company.com", type: "email" },
  { key: 'requirements', question: "What are you looking to build?", icon: FileText, placeholder: "Describe your project briefly...", type: "text" },
] as const;

function LeadCard({ onComplete, onSkip }: LeadCardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [completed, setCompleted] = useState(false);

  const step = steps[currentStep];
  const progress = ((currentStep) / steps.length) * 100;

  const handleSubmitStep = () => {
    if (!inputValue.trim()) return;

    const newData = { ...formData, [step.key]: inputValue.trim() };
    setFormData(newData);
    setInputValue('');

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
      onComplete(newData as unknown as LeadData);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitStep();
    }
  };

  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-5 my-2 max-w-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--brand-gradient)' }}
          >
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
              Thank you, {formData.name}!
            </p>
            <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
              We&apos;ll reach out to you shortly.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 my-2 max-w-sm"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* Progress bar */}
      <div className="w-full h-1 rounded-full mb-4 overflow-hidden" style={{ background: 'var(--border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--brand-gradient)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 mb-3">
        {steps.map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
            style={{
              background: i <= currentStep ? 'hsl(var(--brand-primary))' : 'var(--border)',
            }}
          />
        ))}
        <span className="text-[10px] ml-auto" style={{ color: 'var(--foreground-muted)' }}>
          {currentStep + 1}/{steps.length}
        </span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'hsla(var(--brand-primary), 0.12)' }}
            >
              <step.icon className="w-3.5 h-3.5" style={{ color: 'hsl(var(--brand-primary))' }} />
            </div>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {step.question}
            </p>
          </div>

          {/* Collected values preview */}
          {Object.keys(formData).length > 0 && currentStep > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {Object.entries(formData).map(([key, val]) => (
                <span
                  key={key}
                  className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: 'hsla(var(--brand-primary), 0.08)', color: 'hsl(var(--brand-primary))' }}
                >
                  {val}
                </span>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <input
              type={step.type}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={step.placeholder}
              autoFocus
              aria-label={step.question}
              className="flex-1 text-sm px-3 py-2 rounded-xl outline-none transition-all duration-200"
              style={{
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: 'var(--foreground)',
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitStep}
              disabled={!inputValue.trim()}
              aria-label="Next step"
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white disabled:opacity-30 transition-opacity"
              style={{ background: 'hsl(var(--brand-primary))' }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Skip */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="text-xs mt-3 opacity-50 hover:opacity-80 transition-opacity"
          style={{ color: 'var(--foreground-muted)' }}
          aria-label="Skip lead collection"
        >
          Maybe later
        </button>
      )}
    </motion.div>
  );
}

export default React.memo(LeadCard);
