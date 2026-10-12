import { useEffect, useMemo, useState } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { createAppTheme } from './theme';
import { JobFindingHub } from './components/JobFindingHub';
import { Footer } from './components/Footer';

export function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return window.localStorage.getItem('viaquery-theme') === 'dark';
    } catch (error) {
      console.warn('Could not read the saved theme preference:', error);
      return false;
    }
  });
  const theme = useMemo(() => createAppTheme(isDarkMode ? 'dark' : 'light'), [isDarkMode]);

  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  const toggleTheme = () => {
    const nextIsDarkMode = !isDarkMode;
    setIsDarkMode(nextIsDarkMode);
    try {
      window.localStorage.setItem('viaquery-theme', nextIsDarkMode ? 'dark' : 'light');
    } catch (error) {
      console.warn('Could not save the theme preference:', error);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box data-theme={isDarkMode ? 'dark' : 'light'} sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
        {/* Google Material Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Toolbar sx={{ px: { xs: 2.5, md: 5 }, py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <Box
                component="img"
                src="/favicon.svg"
                alt=""
                sx={{
                  width: 44,
                  height: 42,
                  objectFit: 'contain',
                  flexShrink: 0
                }}
              />
              <Box>
                <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ lineHeight: 1.1, fontSize: '1.4rem', letterSpacing: -0.5 }}>
                  ViaQuery
                </Typography>
                {/* <Typography variant="caption" color="#64748b" fontWeight={600} sx={{ letterSpacing: 0.2 }}>
                  Direct ATS Intelligence & SWE Discovery
                </Typography> */}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<SearchIcon />}
                label="Job Finding Hub"
                sx={{
                  bgcolor: 'action.hover',
                  color: 'primary.main',
                  border: 1,
                  borderColor: 'divider',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  py: 2,
                  px: 1.5,
                  borderRadius: 2.5
                }}
              />
              <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}>
                <IconButton
                  onClick={toggleTheme}
                  color="inherit"
                  aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} theme`}
                  sx={{ color: 'text.secondary' }}
                >
                  {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Main Content Area */}
        <Container maxWidth="xl" sx={{ mt: 3, px: { xs: 2, md: 4 }, flex: 1 }}>
          <JobFindingHub />
        </Container>

        {/* Dedicated Footer with Privacy & Disclaimer */}
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

export default App;
