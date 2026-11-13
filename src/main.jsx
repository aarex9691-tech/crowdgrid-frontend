import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './lib/auth.jsx';
import { CartProvider } from './lib/cart.jsx';
import { ConfirmProvider } from './lib/confirm.jsx';
import { RealtimeProvider } from './lib/realtime.jsx';
import { LanguageProvider } from './lib/i18n.jsx';
import { CelebrateProvider } from './components/SuccessSplash.jsx';
import '@fontsource/mukta/400.css';
import '@fontsource/mukta/600.css';
import '@fontsource/mukta/700.css';
import '@fontsource/mukta/800.css';
import './index.css';
import './styles/theme.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
      <AuthProvider>
        <RealtimeProvider>
          <CartProvider>
            <ConfirmProvider>
              <CelebrateProvider>
                <App />
              </CelebrateProvider>
            </ConfirmProvider>
          </CartProvider>
        </RealtimeProvider>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Offline app shell for the passbook (production builds only; avoids stale dev caches)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
