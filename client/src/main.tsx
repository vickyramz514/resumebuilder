import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import App from './App';

const theme = createTheme({
  palette: {
    primary: { main: '#255c4b', light: '#3d8867', dark: '#173f33' },
    secondary: { main: '#b07a38' },
    background: { default: '#f4f7f5' }
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    button: { fontWeight: 650 }
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 9 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16, boxShadow: '0 30px 70px -20px rgba(23,32,25,.35)' } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 800, letterSpacing: '-0.3px', padding: '22px 26px 6px' } } },
    MuiDialogContent: { styleOverrides: { root: { padding: '10px 26px' } } },
    MuiDialogActions: { styleOverrides: { root: { padding: '16px 26px 22px' } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 14 } } }
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ThemeProvider theme={theme}><CssBaseline /><App /></ThemeProvider></React.StrictMode>);
