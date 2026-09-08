import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Tooltip,
  InputBase,
  Pagination,
  Avatar,
  Stack
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PsychologyIcon from '@mui/icons-material/Psychology';
import type { AppliedJob } from '../types';
import { escapeCsvCell, getSafeExternalUrl } from '../utils/security';

interface AppliedPositionsViewProps {
  appliedJobs: AppliedJob[];
  onRemoveApplied: (jobId: string) => void;
}

export const AppliedPositionsView: React.FC<AppliedPositionsViewProps> = ({
  appliedJobs,
  onRemoveApplied
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [page, setPage] = React.useState(1);
  const itemsPerPage = 8;

  // Filter positions
  const filtered = React.useMemo(() => {
    return appliedJobs.filter(job => {
      const q = searchTerm.toLowerCase();
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.id.toLowerCase().includes(q) ||
        (job.location || '').toLowerCase().includes(q) ||
        job.ats.toLowerCase().includes(q)
      );
    });
  }, [appliedJobs, searchTerm]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const currentItems = React.useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  React.useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const exportToCsv = () => {
    if (appliedJobs.length === 0) return;
    const headers = ['Job ID', 'Company', 'Title', 'ATS', 'Location', 'Experience', 'Date Applied', 'URL'];
    const rows = appliedJobs.map(j => [
      j.id,
      j.company,
      j.title,
      j.ats,
      j.location || '',
      j.experience || '',
      new Date(j.appliedAt).toLocaleDateString(),
      j.url
    ].map(escapeCsvCell));
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `applied_jobs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (appliedJobs.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: { xs: 5, md: 9 },
          textAlign: 'center',
          borderRadius: 4,
          border: '1px dashed #cbd5e1',
          bgcolor: '#ffffff',
          mt: 2
        }}
      >
        <Box
          sx={{
            width: 76,
            height: 76,
            bgcolor: '#f0fdf4',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            border: '2px solid #bbf7d0'
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 40, color: '#16a34a' }} />
        </Box>
        <Typography variant="h5" fontWeight={800} color="#0f172a" gutterBottom>
          No Applications Tracked Yet
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          When reviewing positions in the <strong>Live Open ATS Job Finder</strong>, click the radio button beside any position to mark it as applied. It will automatically be saved and organized here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      {/* 1. Header Banner & Search Toolbar */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3.5,
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          bgcolor: '#ffffff',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                bgcolor: '#f0fdf4',
                color: '#15803d',
                p: 1.2,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #bbf7d0'
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Tracked Applications
                </Typography>
                <Chip
                  label={`${appliedJobs.length} Applied`}
                  size="small"
                  sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, borderRadius: 2 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                Persisted in your browser database. Stored with full Requisition IDs and direct links.
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={exportToCsv}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              borderColor: '#cbd5e1',
              color: '#334155',
              borderRadius: 2.5,
              px: 2.5,
              py: 0.9,
              '&:hover': {
                borderColor: '#1a73e8',
                bgcolor: '#f8fafd'
              }
            }}
          >
            Export to CSV
          </Button>
        </Box>

        {/* Instant Search Bar */}
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 0.8,
            display: 'flex',
            alignItems: 'center',
            mt: 2.5,
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
            placeholder="Search applied records by Job ID, Title, Company, or Location..."
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
      </Paper>

      {/* 2. Sleek Card Feed Layout (No heavy, cluttered table) */}
      <Stack spacing={2.5}>
        {currentItems.map((job) => {
          const safeJobUrl = getSafeExternalUrl(job.url);
          return (
            <Card
              key={job.id}
              elevation={0}
              sx={{
                borderRadius: 3.5,
                border: '1px solid #e2e8f0',
                bgcolor: '#ffffff',
                transition: 'all 0.2s ease',
                '&:hover': {
                  borderColor: '#86efac',
                  boxShadow: '0 6px 20px -4px rgba(22, 163, 74, 0.08)'
                }
              }}
            >
              <CardContent sx={{ p: { xs: 2.5, md: 3 }, '&:last-child': { pb: { xs: 2.5, md: 3 } } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                  {/* Left: Company Avatar + Position Details */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1, minWidth: 280 }}>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: '#f0fdf4',
                        color: '#15803d',
                        fontWeight: 800,
                        fontSize: '1.1rem',
                        border: '1px solid #bbf7d0'
                      }}
                    >
                      {job.company.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ fontSize: '1.1rem' }}>
                          {job.title}
                        </Typography>
                        <Chip
                          label={job.company}
                          size="small"
                          sx={{
                            bgcolor: '#eff6ff',
                            color: '#1d4ed8',
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            borderRadius: 1.5
                          }}
                        />
                        <Chip
                          label={`ATS: ${job.ats}`}
                          size="small"
                          sx={{
                            bgcolor: '#f1f5f9',
                            color: '#475569',
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            borderRadius: 1.5
                          }}
                        />
                      </Box>

                      {/* Metadata Chips: ID, Location, Experience, Applied Date */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mt: 1.2, flexWrap: 'wrap' }}>
                        {/* Requisition ID */}
                        <Typography
                          variant="caption"
                          sx={{
                            fontFamily: 'monospace',
                            color: '#0f172a',
                            bgcolor: '#f8fafc',
                            px: 1,
                            py: 0.4,
                            borderRadius: 1.5,
                            border: '1px solid #cbd5e1',
                            fontWeight: 700,
                            fontSize: '0.78rem'
                          }}
                        >
                          Requisition ID: {job.id}
                        </Typography>

                        {/* Location */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#475569' }}>
                          <LocationOnOutlinedIcon sx={{ fontSize: 17, color: '#64748b' }} />
                          <Typography variant="body2" fontWeight={500}>
                            {job.location || 'Location Not Specified'}
                          </Typography>
                        </Box>

                        {/* Experience */}
                        {job.experience && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#b45309' }}>
                            <PsychologyIcon sx={{ fontSize: 17 }} />
                            <Typography variant="body2" fontWeight={600}>
                              {job.experience}
                            </Typography>
                          </Box>
                        )}

                        {/* Date Applied */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: '#15803d' }}>
                          <CalendarTodayOutlinedIcon sx={{ fontSize: 15 }} />
                          <Typography variant="caption" fontWeight={700}>
                            Applied on {new Date(job.appliedAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  {/* Right: Actions */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      size="medium"
                      endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                      href={safeJobUrl}
                      disabled={!safeJobUrl}
                      target="_blank"
                      rel="noreferrer"
                      sx={{
                        bgcolor: '#1a73e8',
                        '&:hover': { bgcolor: '#1557b0' },
                        textTransform: 'none',
                        fontWeight: 700,
                        px: 2.8,
                        py: 0.9,
                        borderRadius: 2.5,
                        boxShadow: '0 2px 8px rgba(26, 115, 232, 0.2)'
                      }}
                    >
                      View Requisition
                    </Button>

                    <Tooltip title="Remove from applied list">
                      <IconButton
                        onClick={() => onRemoveApplied(job.id)}
                        sx={{
                          color: '#94a3b8',
                          border: '1px solid #e2e8f0',
                          borderRadius: 2.5,
                          p: 0.9,
                          '&:hover': {
                            color: '#dc2626',
                            borderColor: '#fecaca',
                            bgcolor: '#fef2f2'
                          }
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
            <Typography variant="subtitle1" fontWeight={700} color="#64748b">
              No matching applied records found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Try searching with a different Job ID, company, or role title.
            </Typography>
          </Paper>
        )}
      </Stack>

      {/* 3. Pagination */}
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
