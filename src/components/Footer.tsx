import React from 'react';
import {
  Box,
  Container,
  Typography,
  Divider,
  Stack,
  Chip
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import StorageIcon from '@mui/icons-material/Storage';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: 8,
        py: 5,
        bgcolor: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        color: '#64748b'
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2.5, md: 5 } }}>
        <Stack spacing={2.5}>
          {/* Privacy & Zero-Storage Guarantees */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip
              icon={<SecurityIcon sx={{ fontSize: '16px !important', color: '#16a34a !important' }} />}
              label="100% Client-Side Architecture"
              size="small"
              sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700, borderRadius: 2 }}
            />
            <Chip
              icon={<StorageIcon sx={{ fontSize: '16px !important', color: '#2563eb !important' }} />}
              label="Zero Personal Data Stored on Servers"
              size="small"
              sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, borderRadius: 2 }}
            />
          </Box>

          {/* Privacy Statement */}
          <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, maxWidth: 960 }}>
            <strong>Privacy & Data Handling:</strong> This application executes in your browser. Uploaded company CSV datasets, live search parameters, and tracked job applications are stored locally on your device via <code>localStorage</code>. Live searches contact public ATS endpoints directly from your browser, so those providers may receive standard network metadata such as your IP address and request information.
          </Typography>

          {/* Disclaimer */}
          <Typography variant="caption" sx={{ color: '#94a3b8', lineHeight: 1.6, maxWidth: 960 }}>
            <strong>Disclaimer:</strong> Job listings and application links are fetched directly from publicly available Applicant Tracking System (ATS) endpoints (such as Greenhouse, Ashby, and Lever) or direct company career portals. Job availability, requirements, and hiring statuses may change without notice. All trademarks, company names, and logos are the property of their respective owners.
          </Typography>

          <Divider sx={{ my: 1, borderColor: '#f1f5f9' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                component="img"
                src="./viaquery-logo.png"
                alt="ViaQuery"
                sx={{ width: 22, height: 22, borderRadius: 1 }}
              />
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                ViaQuery ATS Explorer • Built with Google Material Design
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Local Browser Storage Engine • Private & Client-Side
            </Typography>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
