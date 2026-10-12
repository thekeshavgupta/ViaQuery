import { createTheme } from '@mui/material/styles';

export const createAppTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#2f81f7' : '#1a73e8',
      dark: mode === 'dark' ? '#1f6feb' : '#1557b0',
      light: mode === 'dark' ? '#1f3a5f' : '#e8f0fe',
    },
    secondary: {
      main: mode === 'dark' ? '#8b949e' : '#0d9488',
      light: mode === 'dark' ? '#30363d' : '#ccfbf1',
    },
    background: {
      default: mode === 'dark' ? '#0d1117' : '#f8fafc',
      paper: mode === 'dark' ? '#161b22' : '#ffffff',
    },
    text: {
      primary: mode === 'dark' ? '#e6edf3' : '#0f172a',
      secondary: mode === 'dark' ? '#8b949e' : '#64748b',
    },
    divider: mode === 'dark' ? '#30363d' : '#e2e8f0',
    ...(mode === 'dark' && {
      action: {
        hover: 'rgba(177, 186, 196, 0.12)',
        selected: 'rgba(47, 129, 247, 0.18)',
      },
    }),
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h4: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    subtitle1: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 14px rgba(26, 115, 232, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: `1px solid ${mode === 'dark' ? '#30363d' : '#e2e8f0'}`,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
            borderColor: mode === 'dark' ? '#2f81f7' : '#93c5fd',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 10,
        },
      },
    },
  },
});
