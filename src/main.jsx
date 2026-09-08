import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import theme from './theme';
import { AuthProvider } from './auth';
import { BrandingProvider } from './branding';

/* One theme for the whole product — a school's identity is its crest and its
   name on the page, not a recolouring of the application. */
function ThemedApp() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrandingProvider>
        <ThemedApp />
      </BrandingProvider>
    </AuthProvider>
  </React.StrictMode>
);
