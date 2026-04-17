import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import App from './App';
import './styles/main.css';

gsap.registerPlugin(ScrollTrigger);

// Light theme Toaster (blue/white)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255,255,255,0.95)',
            color: '#1F2937',
            border: '1px solid rgba(0,0,0,0.08)',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '13.5px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' }, style: { background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.2)' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' }, style: { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.2)' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
