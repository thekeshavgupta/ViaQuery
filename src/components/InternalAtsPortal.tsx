import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  InputBase,
  Pagination,
  Avatar
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LanguageIcon from '@mui/icons-material/Language';
import type { CompanyRecord } from '../types';
import { getSafeExternalUrl } from '../utils/security';

interface InternalAtsPortalProps {
  companies: CompanyRecord[];
}

export const InternalAtsPortal: React.FC<InternalAtsPortalProps> = ({ companies }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedSystem, setSelectedSystem] = React.useState<string>('all');
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 12;

  // Filter systems list
  const systemCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: companies.length };
    for (const c of companies) {
      const sys = (c.ATS || 'Internal').trim();
      const key = sys.toLowerCase().includes('workday')
        ? 'Workday'
        : sys.toLowerCase().includes('internal')
          ? 'Internal'
          : sys.toLowerCase().includes('oracle')
            ? 'Oracle'
            : sys.toLowerCase().includes('icims')
              ? 'iCIMS'
              : 'Other';
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }, [companies]);

  const filtered = React.useMemo(() => {
    return companies.filter(c => {
      const q = searchTerm.toLowerCase();
      const matchesQuery = (
        c.Company.toLowerCase().includes(q) ||
        (c.ATS || '').toLowerCase().includes(q) ||
        (c.sampleUrl || '').toLowerCase().includes(q)
      );

      if (!matchesQuery) return false;
      if (selectedSystem === 'all') return true;

      const sys = (c.ATS || '').toLowerCase();
      if (selectedSystem === 'Workday') return sys.includes('workday');
      if (selectedSystem === 'Internal') return sys.includes('internal');
      if (selectedSystem === 'Oracle') return sys.includes('oracle');
      if (selectedSystem === 'iCIMS') return sys.includes('icims');
      return true;
    });
  }, [companies, searchTerm, selectedSystem]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentItems = React.useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedSystem]);

  const getSystemChipColor = (ats: string) => {
    const a = (ats || '').toLowerCase();
    if (a.includes('workday')) return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
    if (a.includes('internal')) return { bg: '#fef2f2', text: '#991b1b', border: '#fecaca' };
    if (a.includes('oracle')) return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
    if (a.includes('icims')) return { bg: '#f3e8ff', text: '#6b21a8', border: '#e9d5ff' };
    return { bg: '#f1f5f9', text: '#334155', border: '#e2e8f0' };
  };

  return (
    <Box sx={{ mt: 1 }}>
      {/* 1. Header Banner */}
      <Paper
        elevation={0}
        sx={{
          mb: 3.5,
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              bgcolor: '#eff6ff',
              color: '#1d4ed8',
              p: 1.2,
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LockOutlinedIcon sx={{ fontSize: 26 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography variant="h6" fontWeight={800} color="#0f172a">
                Enterprise & Closed Career Portals
              </Typography>
              <Chip
                label={`${companies.length} Companies`}
                size="small"
                sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, borderRadius: 2 }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>
              Direct requisition links to proprietary company portals (Google, Apple, Meta), Workday, Oracle, and iCIMS.
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* 2. Clean Filter Controls (Search + System Pills) */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 3.5,
          borderRadius: 3.5,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff'
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search Input */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 0.8,
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #cbd5e1',
                borderRadius: 2.5,
                bgcolor: '#f8fafc',
                '&:focus-within': {
                  borderColor: '#1a73e8',
                  bgcolor: '#ffffff'
                }
              }}
            >
              <SearchIcon sx={{ color: '#64748b', mr: 1, fontSize: 20 }} />
              <InputBase
                placeholder="Search company (e.g. Google, Adobe, Nvidia, Apple)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: 1, fontSize: '0.92rem', fontWeight: 500 }}
              />
              {searchTerm && (
                <Button size="small" onClick={() => setSearchTerm('')} sx={{ fontSize: '0.78rem', minWidth: 'auto', p: 0.5 }}>
                  Clear
                </Button>
              )}
            </Paper>
          </Grid>

          {/* Quick System Filter Chips */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              {[
                { id: 'all', label: `All (${companies.length})` },
                { id: 'Workday', label: `Workday (${systemCounts['Workday'] || 0})` },
                { id: 'Internal', label: `Internal (${systemCounts['Internal'] || 0})` },
                { id: 'Oracle', label: `Oracle (${systemCounts['Oracle'] || 0})` },
                { id: 'iCIMS', label: `iCIMS (${systemCounts['iCIMS'] || 0})` }
              ].map(item => (
                <Chip
                  key={item.id}
                  label={item.label}
                  clickable
                  onClick={() => setSelectedSystem(item.id)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    bgcolor: selectedSystem === item.id ? '#1a73e8' : '#f1f5f9',
                    color: selectedSystem === item.id ? '#ffffff' : '#475569',
                    '&:hover': {
                      bgcolor: selectedSystem === item.id ? '#1557b0' : '#e2e8f0'
                    },
                    borderRadius: 2
                  }}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 3. Spacious, Uncluttered Cards Grid */}
      <Grid container spacing={2.5}>
        {currentItems.map((comp, idx) => {
          const chipStyle = getSystemChipColor(comp.ATS);
          const targetUrl = getSafeExternalUrl(comp.sampleUrl) || `https://www.google.com/search?q=${encodeURIComponent(comp.Company + ' careers')}`;
          let domainDisplay = 'Company Career Portal';
          try {
            if (comp.sampleUrl) {
              const u = new URL(comp.sampleUrl);
              domainDisplay = u.hostname.replace('www.', '');
            }
          } catch {
            domainDisplay = comp.sampleUrl || 'Company Career Portal';
          }

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
              <Card
                elevation={0}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3.5,
                  border: '1px solid #e2e8f0',
                  bgcolor: '#ffffff',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    borderColor: '#93c5fd',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.06)'
                  }
                }}
              >
                <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {/* Card Header: Avatar, Name & System Tag */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
                            bgcolor: '#f1f5f9',
                            color: '#1e293b',
                            fontWeight: 800,
                            fontSize: '1rem',
                            border: '1px solid #e2e8f0'
                          }}
                        >
                          {comp.Company.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ fontSize: '1.05rem', lineHeight: 1.2 }}>
                          {comp.Company}
                        </Typography>
                      </Box>

                      <Chip
                        label={comp.ATS || 'Internal'}
                        size="small"
                        sx={{
                          bgcolor: chipStyle.bg,
                          color: chipStyle.text,
                          border: `1px solid ${chipStyle.border}`,
                          fontWeight: 700,
                          fontSize: '0.74rem',
                          height: 22,
                          borderRadius: 1.5
                        }}
                      />
                    </Box>

                    {/* Domain or Link Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: '#64748b', mb: 2 }}>
                      <LanguageIcon sx={{ fontSize: 15 }} />
                      <Typography
                        variant="caption"
                        fontWeight={500}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {domainDisplay}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Visit Portal Button */}
                  <Button
                    fullWidth
                    variant="outlined"
                    size="medium"
                    endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      borderColor: '#cbd5e1',
                      color: '#1a73e8',
                      borderRadius: 2.5,
                      py: 0.8,
                      '&:hover': {
                        borderColor: '#1a73e8',
                        bgcolor: '#f8fafd'
                      }
                    }}
                  >
                    Open Career Portal
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}

        {filtered.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
              <Typography variant="subtitle1" fontWeight={700} color="#64748b">
                No matching companies found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Try clearing your search query or selecting a different ATS system above.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, val) => setPage(val)}
            color="primary"
            shape="rounded"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                fontWeight: 700,
                borderRadius: 2
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
};
