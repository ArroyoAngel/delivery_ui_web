'use client';

import { useMemo, useRef, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import api from '@/lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getConfig() {
  return {
    enabled: true,
  };
}

export default function AIFloatingChat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hola, soy tu asistente IA del panel. Puedo ayudarte con pedidos, restaurantes y métricas.',
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);

  const cfg = useMemo(() => getConfig(), []);

  async function sendMessage() {
    const msg = text.trim();
    if (!msg || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: msg }];
    setMessages(nextMessages);
    setText('');
    setLoading(true);

    try {
      if (!cfg.enabled) {
        throw new Error('Asistente IA deshabilitado.');
      }

      const { data } = await api.post('/api/ai/chat', {
        messages: nextMessages,
      });

      const parsed = data as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const reply = parsed.choices?.[0]?.message?.content?.trim() || 'Sin respuesta.';

      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el asistente IA.';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `No pude responder ahora. ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      }, 50);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-orange-500 text-white">
            <div className="flex items-center gap-2">
              <Bot size={16} />
              <p className="text-sm font-medium">Asistente IA</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/20">
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} className="h-80 overflow-y-auto px-3 py-3 space-y-2 bg-gray-50">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'ml-auto bg-orange-500 text-white'
                    : 'mr-auto bg-white text-gray-700 border border-gray-200'
                }`}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <div className="mr-auto bg-white text-gray-500 border border-gray-200 rounded-2xl px-3 py-2 text-sm">
                Escribiendo...
              </div>
            )}
          </div>

          <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Pregúntame algo..."
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={loading || !text.trim()}
              className="h-10 w-10 rounded-xl bg-orange-500 text-white grid place-items-center disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-orange-500 text-white shadow-xl grid place-items-center hover:bg-orange-600 transition-colors"
        title="Asistente IA"
      >
        <MessageCircle size={22} />
      </button>
    </>
  );
}
