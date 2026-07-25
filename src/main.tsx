import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { Toaster } from '@/shared/components/ui/sonner';
import { applyTheme, getTheme } from '@/shared/lib/utils';
import { AuthProvider } from '@/modules/auth/context/AuthContext';

applyTheme(getTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

