import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="628522086323-9h53mtfkjv2a4c1qat581laka4ohirjk.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
