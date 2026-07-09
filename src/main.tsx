import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// GA4 — injects only when VITE_GA_ID is set (no-op otherwise)
const gaId = import.meta.env.VITE_GA_ID;
if (gaId && typeof window !== 'undefined') {
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.appendChild(s);

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: unknown[]) { ((window as any).dataLayer as unknown[]).push(args); }
  gtag('js', new Date());
  gtag('config', gaId);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
