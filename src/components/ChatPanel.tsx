import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, AlertTriangle } from 'lucide-react';
import type { ChatMessage } from '@/lib/supabase';

type ChatPanelProps = {
  title: string;
  subtitle: string;
  messages: ChatMessage[];
  onSend: (message: string) => void;
  placeholder?: string;
  suggestedQuestions?: string[];
};

export function ChatPanel({ title, subtitle, messages, onSend, placeholder, suggestedQuestions }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card flex flex-col h-full" style={{ minHeight: 500 }}>
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 py-4" style={{ maxHeight: 'calc(100vh - 420px)', minHeight: 300 }}>
        {messages.length === 0 && (
          <div className="text-center py-10">
            <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Start a conversation with the AI assistant</p>
            {suggestedQuestions && suggestedQuestions.length > 0 && (
              <div className="mt-4 space-y-2 max-w-sm mx-auto">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onSend(q)}
                    className="block w-full text-left px-3 py-2 text-sm rounded-lg bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-300 text-slate-600 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-slate-200' : 'bg-gradient-to-br from-cyan-500 to-teal-600'
            }`}>
              {msg.role === 'user' ? <UserIcon className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-cyan-600 text-white'
                : 'bg-slate-50 text-slate-700 border border-slate-200'
            }`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <p className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-cyan-100' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-[11px] text-slate-400">AI provides general information only, not a medical diagnosis.</p>
        </div>
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="input-field resize-none"
            rows={2}
            placeholder={placeholder || 'Type your message...'}
          />
          <button
            onClick={handleSend}
            className="btn-primary flex items-center justify-center px-3 self-stretch"
            disabled={!input.trim()}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
