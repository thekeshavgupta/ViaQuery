import React, { useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Pagination,
  Paper,
  Stack,
  Avatar,
  Radio,
  FormControl,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PsychologyIcon from '@mui/icons-material/Psychology';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { JobItem } from '../types';
import { getSafeExternalUrl } from '../utils/security';

function getPostedTimestamp(value: string | undefined): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function formatPostedDate(value: string | undefined): string {
  const timestamp = getPostedTimestamp(value);
  return timestamp ? new Date(timestamp).toLocaleDateString() : value || '';
}

interface JobListProps {
  jobs: JobItem[];
  companyOpeningCounts: Record<string, number>;
  companyFetchErrors: Record<string, string>;
  appliedJobIds: Set<string>;
  onToggleApplied: (job: JobItem) => void;
}

export const JobList: React.FC<JobListProps> = ({
  jobs,
  companyOpeningCounts,
  companyFetchErrors,
  appliedJobIds,
  onToggleApplied
}) => {
  const [page, setPage] = React.useState(1);
  const [jobsPerPage, setJobsPerPage] = React.useState<number>(10);
  const [companyFilter, setCompanyFilter] = React.useState('');
  const listTopRef = useRef<HTMLDivElement>(null);

  const normalizedCompanyFilter = companyFilter.trim().toLowerCase();
  const visibleJobs = React.useMemo(() => {
    if (!normalizedCompanyFilter) return jobs;
    return jobs.filter(job => job.company.toLowerCase().includes(normalizedCompanyFilter));
  }, [jobs, normalizedCompanyFilter]);

  // Sort/group jobs so jobs from the same company stay together
  const sortedJobs = React.useMemo(() => {
    return [...visibleJobs].sort((a, b) => {
      const companyDifference = (a.company || '').localeCompare(b.company || '');
      const postedDifference = getPostedTimestamp(b.updatedAt) - getPostedTimestamp(a.updatedAt);
      return companyDifference || postedDifference || a.title.localeCompare(b.title);
    });
  }, [visibleJobs]);

  const totalPages = Math.ceil(sortedJobs.length / jobsPerPage) || 1;
  const currentJobs = React.useMemo(() => {
    const start = (page - 1) * jobsPerPage;
    return sortedJobs.slice(start, start + jobsPerPage);
  }, [sortedJobs, page, jobsPerPage]);

  const uniqueCompaniesCount = React.useMemo(() => {
    return new Set(visibleJobs.map(j => j.company)).size;
  }, [visibleJobs]);

  const companiesWithOpenings = Object.values(companyOpeningCounts).filter(count => count > 0).length;
  const companiesWithoutOpenings = Object.values(companyOpeningCounts).filter(count => count === 0).length;
  const companiesWithFetchErrors = Object.keys(companyFetchErrors).length;

  React.useEffect(() => {
    setPage(1);
  }, [visibleJobs, jobsPerPage, companyFilter]);


  const handlePageChange = (_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getAtsBadgeColor = (ats: string) => {
    const a = ats.toLowerCase();
    if (a.includes('greenhouse')) return { bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' };
    if (a.includes('ashby')) return { bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' };
    if (a.includes('lever')) return { bg: '#fffbeb', text: '#92400e', border: '#fde68a' };
    return { bg: '#f8fafc', text: '#334155', border: '#e2e8f0' };
  };

  const getExperienceBadgeColor = (exp: string) => {
    if (exp === 'Not specified') {
      return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
    if (exp.includes('0-1') || exp.toLowerCase().includes('intern')) {
      return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' };
    }
    return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
  };

  const companyMetrics = (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
      <Chip
        label={`${companiesWithOpenings} companies with openings`}
        size="small"
        sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700, borderRadius: 2 }}
      />
      <Chip
        label={`${companiesWithoutOpenings} companies with no matching openings`}
        size="small"
        sx={{ bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 700, borderRadius: 2 }}
      />
      <Chip
        label={`${companiesWithFetchErrors} companies could not be fetched`}
        size="small"
        sx={{ bgcolor: '#fef2f2', color: '#b91c1c', fontWeight: 700, borderRadius: 2 }}
      />
    </Box>
  );

  const companyFilterControl = (
    <TextField
      size="small"
      label="Filter output by company"
      value={companyFilter}
      onChange={(event) => setCompanyFilter(event.target.value)}
      placeholder="e.g. Stripe or Google"
      sx={{ minWidth: { xs: '100%', sm: 280 }, mb: 2 }}
    />
  );
  const hasVisibleJobs = jobs.length > 0 && visibleJobs.length > 0;

  return (
    <Box sx={{ mt: 4 }}>
      {/* Scroll Anchor */}
      <div ref={listTopRef} style={{ scrollMarginTop: '90px' }} />

      {companyMetrics}

      {/* Header Stat Strip & Paging Controls */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          px: 1,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        {companyFilterControl}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h6" fontWeight={800} color="#0f172a">
            Live Opportunities
          </Typography>
          <Chip
            label={`${jobs.length} Positions`}
            size="small"
            sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 700, borderRadius: 2 }}
          />
          <Chip
            label={`${uniqueCompaniesCount} Companies`}
            size="small"
            sx={{ bgcolor: '#f0fdf4', color: '#15803d', fontWeight: 700, borderRadius: 2 }}
          />
        </Box>

        {/* Right side: Jobs per page + Page indicator */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" fontWeight={700} color="#64748b">
              OPENINGS PER PAGE:
            </Typography>
            <FormControl size="small">
              <Select
                value={jobsPerPage}
                onChange={(e) => setJobsPerPage(Number(e.target.value))}
                sx={{
                  height: 34,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: 2,
                  bgcolor: '#ffffff',
                  '& .MuiSelect-select': { py: 0.5, px: 1.5 }
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Showing openings <strong>{((page - 1) * jobsPerPage) + 1}–{Math.min(page * jobsPerPage, sortedJobs.length)}</strong> of <strong>{sortedJobs.length}</strong>
          </Typography>
        </Box>
      </Box>

      {!hasVisibleJobs && (
        <Paper
          sx={{ p: { xs: 4, md: 8 }, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e1', bgcolor: '#ffffff' }}
        >
          <Box sx={{ width: 72, height: 72, bgcolor: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <WorkOutlineIcon sx={{ fontSize: 36, color: '#64748b' }} />
          </Box>
          <Typography variant="h5" fontWeight={800} color="#0f172a" gutterBottom>
            {jobs.length === 0 ? 'No Matching Opportunities' : 'No Companies Match This Filter'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, margin: '0 auto' }}>
            {jobs.length === 0
              ? <>Select target companies from the dropdown above, choose one or more regions, and click <strong>"Find Live Jobs"</strong>.</>
              : 'Try a different company name.'}
          </Typography>
        </Paper>
      )}

      {/* Render Current Page of Jobs, Grouped by Company */}
      {hasVisibleJobs && <>
        <Stack spacing={3.5}>
          {(() => {
            // Group the current page's slice of jobs by company
            const pageGroupMap = new Map<string, JobItem[]>();
            for (const job of currentJobs) {
              const comp = job.company || 'Other Opportunities';
              if (!pageGroupMap.has(comp)) {
                pageGroupMap.set(comp, []);
              }
              pageGroupMap.get(comp)!.push(job);
            }

            return Array.from(pageGroupMap.entries()).map(([company, companyJobs]) => {
              const atsName = companyJobs[0]?.ats || 'ATS';
              const atsStyle = getAtsBadgeColor(atsName);

              return (
                <Paper
                  key={company}
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    bgcolor: '#ffffff',
                    boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: '#93c5fd',
                      boxShadow: '0 12px 30px -8px rgba(37, 99, 235, 0.08)'
                    }
                  }}
                >
                  {/* 1. COMPANY HEADING ON TOP */}
                  <Box
                    sx={{
                      bgcolor: '#f8fafc',
                      px: { xs: 2.5, md: 3.5 },
                      py: 2,
                      borderBottom: '1px solid #edf2f7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: '#dbeafe',
                          color: '#1d4ed8',
                          width: 44,
                          height: 44,
                          fontWeight: 800,
                          fontSize: '1.15rem',
                          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)'
                        }}
                      >
                        {company.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={800} color="#0f172a" sx={{ lineHeight: 1.2 }}>
                          {company}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.2 }}>
                          {companyOpeningCounts[company] ?? companyJobs.length} matching opening{(companyOpeningCounts[company] ?? companyJobs.length) !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={`ATS: ${atsName}`}
                      size="small"
                      sx={{
                        bgcolor: atsStyle.bg,
                        color: atsStyle.text,
                        border: `1px solid ${atsStyle.border}`,
                        fontWeight: 700,
                        px: 1,
                        py: 1.5,
                        fontSize: '0.8rem',
                        borderRadius: 2
                      }}
                    />
                  </Box>

                  {/* 2. POSITIONS BELOW COMPANY HEADING */}
                  <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                    <Stack spacing={1.8}>
                      {companyJobs.map((job) => {
                        const expStyle = getExperienceBadgeColor(job.experience);
                        const isApplied = appliedJobIds.has(job.id);
                        const safeJobUrl = getSafeExternalUrl(job.url);

                        return (
                          <Card
                            key={job.id}
                            elevation={0}
                            sx={{
                              borderRadius: 3,
                              border: isApplied ? '1.5px solid #86efac' : '1px solid #f1f5f9',
                              bgcolor: isApplied ? '#f0fdf4' : '#ffffff',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                borderColor: isApplied ? '#22c55e' : '#3b82f6',
                                transform: 'translateY(-1px)',
                                boxShadow: isApplied
                                  ? '0 6px 16px rgba(34, 197, 94, 0.1)'
                                  : '0 6px 16px rgba(59, 130, 246, 0.08)'
                              }
                            }}
                          >
                            <CardContent sx={{ p: { xs: 2, md: 2.2 }, '&:last-child': { pb: { xs: 2, md: 2.2 } } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                {/* Left Side: Radio Button + Title & Badges */}
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1, minWidth: 280 }}>
                                  <Box sx={{ pt: 0.2 }}>
                                    <Radio
                                      checked={isApplied}
                                      onClick={() => onToggleApplied(job)}
                                      color="success"
                                      size="small"
                                      sx={{
                                        p: 0.5,
                                        color: isApplied ? '#16a34a' : '#cbd5e1',
                                        '&.Mui-checked': {
                                          color: '#16a34a'
                                        }
                                      }}
                                    />
                                  </Box>

                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                      <Typography variant="h6" fontWeight={700} color="#0f172a" sx={{ fontSize: '1.05rem' }}>
                                        {job.title}
                                      </Typography>
                                      {isApplied && (
                                        <Chip
                                          icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#15803d !important' }} />}
                                          label="Applied"
                                          size="small"
                                          sx={{
                                            bgcolor: '#dcfce7',
                                            color: '#15803d',
                                            border: '1px solid #bbf7d0',
                                            fontWeight: 800,
                                            fontSize: '0.72rem',
                                            height: 22
                                          }}
                                        />
                                      )}
                                    </Box>

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontFamily: 'monospace',
                                          color: '#64748b',
                                          bgcolor: '#f1f5f9',
                                          px: 1,
                                          py: 0.3,
                                          borderRadius: 1.5,
                                          fontWeight: 600
                                        }}
                                      >
                                        ID: {job.id.length > 18 ? `${job.id.slice(0, 16)}...` : job.id}
                                      </Typography>

                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b' }}>
                                        <LocationOnOutlinedIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                                        <Typography variant="body2" color="text.secondary" fontWeight={500}>
                                          {job.location || 'Remote / Unspecified'}
                                        </Typography>
                                      </Box>

                                      {job.experience && (
                                        <Chip
                                          icon={<PsychologyIcon sx={{ fontSize: '14px !important', color: `${expStyle.text} !important` }} />}
                                          label={job.experience}
                                          size="small"
                                          sx={{
                                            bgcolor: expStyle.bg,
                                            color: expStyle.text,
                                            border: `1px solid ${expStyle.border}`,
                                            fontWeight: 600,
                                            fontSize: '0.75rem',
                                            height: 24
                                          }}
                                        />
                                      )}

                                      {job.updatedAt && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#94a3b8' }}>
                                          <AccessTimeIcon sx={{ fontSize: 14 }} />
                                          <Typography variant="caption" color="text.secondary">
                                            Posted {formatPostedDate(job.updatedAt)}
                                          </Typography>
                                        </Box>
                                      )}
                                    </Box>
                                  </Box>
                                </Box>

                                {/* Right Side: Apply Button */}
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
                                    Apply
                                  </Button>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </Stack>
                  </Box>
                </Paper>
              );
            });
          })()}
        </Stack>

        {/* Spacious Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mt: 5, mb: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              shape="rounded"
              size="large"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontWeight: 700,
                  borderRadius: 2
                }
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Page {page} of {totalPages} ({sortedJobs.length} total opportunities)
            </Typography>
          </Box>
        )}
      </>}
    </Box>
  );
};
