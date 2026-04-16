import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0F1729',
            color: '#F0F4FF',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: "'Satoshi', sans-serif",
            fontSize: '13.5px',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#0F1729' } },
          error: { iconTheme: { primary: '#F43F5E', secondary: '#0F1729' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
