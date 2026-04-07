import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

if ("serviceWorker" in navigator) {
  registerSW({ immediate: true });
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

console.log("Leila OS: Initializing Core...", { hasGoogleId: !!clientId });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    {clientId ? (
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
// Final verification for core initialization
