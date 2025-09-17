import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import BuzzerApp from './components/BuzzerApp.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const urlParams = new URLSearchParams(window.location.search);
const isBuzzerPage = urlParams.get('page') === 'buzzer';

const root = ReactDOM.createRoot(rootElement);

if (isBuzzerPage) {
  root.render(
    <React.StrictMode>
      <BuzzerApp />
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <LanguageProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </LanguageProvider>
    </React.StrictMode>
  );
}