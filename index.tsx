import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

if ("serviceWorker" in navigator) {
  registerSW({ immediate: true });
}

// Always provide a clientId to avoid GoogleOAuthProvider errors
// Fallback to empty string which satisfies the prop type but might log a warning
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

console.log("Leila OS: Initializing Core...", { hasGoogleId: !!clientId });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
