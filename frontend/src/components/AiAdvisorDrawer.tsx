import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AiAdvisorDrawer: React.FC = () => {
  const {
    isAdvisorOpen,
    setIsAdvisorOpen,
    currentUser,
    advisorMessages,
    isAdvisorTyping,
    sendAdvisorMessage,
  } = useApp();

  const [inputText, setInputText] = useState<string>('');

  if (!isAdvisorOpen) return null;

  const quickPrompts = [
    `Should I pick NVIDIA Data Science or AIML given my ${currentUser.cgpa.toFixed(2)} CGPA?`,
    'Which Semester V Generic Elective has the lightest lab workload?',
    'What are my seat allotment odds and tie-breaker rules for Choice #1?',
    'Compare Xebia DevOps vs EC-Council Cyber Security tracks.',
  ];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAdvisorTyping) return;
    const msg = inputText;
    setInputText('');
    await sendAdvisorMessage(msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        {/* Drawer Header */}
        <div className="p-5 bg-gradient-to-r from-[#8B1E24] to-[#0F172A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold">TIET AI Academic Advisor</h3>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  RAG + SHAP Grounded
                </span>
              </div>
              <p className="text-xs text-white/80">
                Active Context: {currentUser.name} ({currentUser.cgpa.toFixed(2)} CGPA)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAdvisorOpen(false)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
            aria-label="Close AI Advisor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Prompts Strip */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#8B1E24] dark:text-rose-400" />
            <span>Suggested Institutional Queries (1-Click):</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendAdvisorMessage(prompt)}
                className="text-left px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#8B1E24] text-[11px] font-medium text-slate-700 dark:text-slate-200 transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {advisorMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-[#8B1E24] text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 ${
                  msg.role === 'user'
                    ? 'bg-[#8B1E24] text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>

                {msg.referencedCodes && msg.referencedCodes.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700 flex flex-wrap items-center gap-1">
                    <span className="text-[10px] font-bold text-slate-400">Referenced Codes:</span>
                    {msg.referencedCodes.map((code) => (
                      <span
                        key={code}
                        className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 font-mono text-[10px] font-bold text-[#8B1E24] dark:text-rose-400 border border-slate-200 dark:border-slate-700"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isAdvisorTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Bot className="w-4 h-4 text-[#8B1E24] animate-bounce" />
              <span>Synthesizing TIET curriculum & MongoDB Atlas seat telemetry...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask about UCS549, NVIDIA vs AIML, seat cutoffs..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#8B1E24]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isAdvisorTyping}
            className="px-4 py-2.5 rounded-xl bg-[#8B1E24] hover:bg-[#70161B] disabled:opacity-40 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};

