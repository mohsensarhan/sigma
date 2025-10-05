import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GlobalSettingsProvider } from './contexts/GlobalSettingsContext';
import App from './App.tsx';
import './index.css';
import 'mapbox-gl/dist/mapbox-gl.css';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <GlobalSettingsProvider>
        <App />
      </GlobalSettingsProvider>
    </AuthProvider>
  </BrowserRouter>
);
