import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { theme } from './theme';
import { JobFindingHub } from './components/JobFindingHub';
import { Footer } from './components/Footer';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafd', display: 'flex', flexDirection: 'column' }}>
        {/* Google Material Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            backdropFilter: 'blur(8px)'
          }}
        >
          <Toolbar sx={{ px: { xs: 2.5, md: 5 }, py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
              <Box
                component="img"
                src="./viaquery-logo.png"
                alt="ViaQuery Logo"
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 14px rgba(26, 115, 232, 0.25)',
                  border: '1px solid #bfdbfe',
                  objectFit: 'cover'
                }}
              />
              <Box>
                <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.1, fontSize: '1.4rem', letterSpacing: -0.5 }}>
                  <span style={{ color: '#0f172a' }}>Via</span>
                  <span style={{ color: '#0f172a' }}>Query</span>
                </Typography>
                {/* <Typography variant="caption" color="#64748b" fontWeight={600} sx={{ letterSpacing: 0.2 }}>
                  Direct ATS Intelligence & SWE Discovery
                </Typography> */}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<SearchIcon sx={{ color: '#1d4ed8 !important' }} />}
                label="Job Finding Hub"
                sx={{
                  bgcolor: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  py: 2,
                  px: 1.5,
                  borderRadius: 2.5
                }}
              />
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
