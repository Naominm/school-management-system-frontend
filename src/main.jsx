import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { buildTheme } from './theme';
import { AuthProvider } from './auth';
import { BrandingProvider, useBranding } from './branding';

/* The theme follows the signed-in school's colour, falling back to the Ledger
   gold when a school has not set one. */
function ThemedApp() {
  const { branding } = useBranding();
  const theme = React.useMemo(() => buildTheme(branding?.crest_colour), [branding?.crest_colour]);
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
