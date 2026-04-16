import React, { useState, useRef, useEffect } from 'react';
import { Spinner } from './ui';
import api from '../utils/api';

const PROMPTS = [
  'Which scholarship suits me best?',
  'What documents do I need?',
  'How does AI matching work?',
  'Scholarship for SC/ST students?',
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: 'bot', text: 'Hi! I\'m your NSMP Scholar Assistant. Ask me anything about scholarships! 🎓', time: new Date() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMsgs = [...msgs, { role: 'user', text: msg, time: new Date() }];
    setMsgs(newMsgs);
    setLoading(true);

    try {
      const history = newMsgs
        .filter((m, i) => !(i === 0 && m.role === 'bot'))
        .map((m) => ({ role: m.role === 'bot' ? 'assistant' : 'user', content: m.text }));

      const res = await api.post('/ai/chat', { messages: history });
      setMsgs((prev) => [...prev, { role: 'bot', text: res.data.reply, time: new Date() }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Network error. Please try again.';
      setMsgs((prev) => [...prev, { role: 'bot', text: msg, time: new Date() }]);
    }
    setLoading(false);
  };

  const fmt = (d) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <button className="chatbot-fab" onClick={() => setOpen((v) => !v)} title="AI Scholar Assistant">
        {open ? '✕' : '🤖'}
      </button>

      {open && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-avatar">🤖</div>
            <div>
              <div className="chatbot-name">Scholar AI</div>
              <div className="chatbot-status">● Online — Ask me anything</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, color: '#fff', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >✕</button>
          </div>

          <div className="chatbot-messages">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.text}
                <div className="chat-time">{fmt(m.time)}</div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <Spinner size={14} />
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chatbot-prompts">
            {PROMPTS.map((p) => (
              <button key={p} className="prompt-chip" onClick={() => send(p)}>{p}</button>
            ))}
          </div>

          <div className="chatbot-input-wrap">
            <input
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about scholarships..."
            />
            <button
              className="btn btn-primary btn-icon"
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
