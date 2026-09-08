import React, { useRef, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Chip,
  Alert,
  Tabs,
  Tab,
  Paper,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ClearIcon from '@mui/icons-material/Clear';
import SelectAllIcon from '@mui/icons-material/SelectAll';
import StopIcon from '@mui/icons-material/Stop';
import Papa from 'papaparse';
import type { CompanyRecord, JobItem, FilterState, AppliedJob } from '../types';
import { parseAtsAndSlug, fetchGreenhouseJobs, fetchLeverJobs, fetchAshbyJobs, fetchSmartRecruitersJobs } from '../services/atsService';
import { CONTINENTS, isLocationInAnyContinent } from '../utils/continentMapping';
import { getAppliedJobs, saveAppliedJob, removeAppliedJob } from '../utils/appliedJobsStorage';
import { JobList } from './JobList';
import { InternalAtsPortal } from './InternalAtsPortal';
import { AppliedPositionsView } from './AppliedPositionsView';
import { NoMatchingCompaniesView } from './NoMatchingCompaniesView';

const MAX_CSV_BYTES = 5 * 1024 * 1024;
const MAX_COMPANIES = 3000;

export const JobFindingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  // Applied positions state (synced with localStorage)
  const [appliedMap, setAppliedMap] = useState<Record<string, AppliedJob>>(() => getAppliedJobs());

  // Companies state (Empty initially - user brings their own dataset)
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [loadingFile, setLoadingFile] = useState<boolean>(false);

  // Job Search Filters
  const [filters, setFilters] = useState<FilterState>({
    role: 'Software Engineer',
    location: '',
    continent: 'All Continents',
    keywords: ''
  });

  // Query state
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [companyOpeningCounts, setCompanyOpeningCounts] = useState<Record<string, number>>({});
  const [companyFetchedCounts, setCompanyFetchedCounts] = useState<Record<string, number>>({});
  const [companyFetchErrors, setCompanyFetchErrors] = useState<Record<string, string>>({});
  const [fetchingJobs, setFetchingJobs] = useState<boolean>(false);
  const [fetchProgress, setFetchProgress] = useState<{ current: number; total: number; company: string }>({
    current: 0,
    total: 0,
    company: ''
  });
  const [statusMessage, setStatusMessage] = useState<string>('');
  const fetchControllerRef = useRef<AbortController | null>(null);

  const appliedJobIds = new Set(Object.keys(appliedMap));
  const appliedJobsList = Object.values(appliedMap).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());

  const handleToggleApplied = (job: JobItem) => {
    if (appliedMap[job.id]) {
      removeAppliedJob(job.id);
      const copy = { ...appliedMap };
      delete copy[job.id];
      setAppliedMap(copy);
    } else {
      saveAppliedJob(job);
      setAppliedMap(getAppliedJobs());
    }
  };

  const handleRemoveApplied = (jobId: string) => {
    removeAppliedJob(jobId);
    const copy = { ...appliedMap };
    delete copy[jobId];
    setAppliedMap(copy);
  };

  const loadSampleDataset = () => {
    setLoadingFile(true);
    fetch('./Companies.csv')
      .then(res => res.text())
      .then(csvText => {
        parseAndLoadCsv(csvText, 'Companies.csv (Sample Reference Dataset)');
      })
      .catch(err => {
        console.error('Failed to load sample dataset:', err);
        setLoadingFile(false);
      });
  };

  const parseAndLoadCsv = (csvText: string, sourceName: string) => {
    setLoadingFile(true);
    if (new Blob([csvText]).size > MAX_CSV_BYTES) {
      setStatusMessage('CSV file is too large. Please upload a file smaller than 5 MB.');
      setLoadingFile(false);
      return;
    }
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed: CompanyRecord[] = [];
        for (const row of results.data as any[]) {
          if (parsed.length >= MAX_COMPANIES) break;
          const compName = (row.Company || row.company || row.name || '').trim();
          const rawAts = (row.ATS || row.ats || row.ats_system || '').trim();
          const sampleUrl = (row['Job URL'] || row.job_url || row.url || '').trim();

          if (compName) {
            const parsedMeta = parseAtsAndSlug(compName, rawAts, sampleUrl);
            parsed.push({
              Company: compName,
              ATS: rawAts || 'Internal',
              sampleUrl: sampleUrl,
              ...parsedMeta
            });
          }
        }

        setCompanies(parsed);
        setFileName(sourceName);
        // Default select first 12 open ATS companies
        const openAts = parsed.filter(c => !c.isInternalOrUnsupported).slice(0, 12).map(c => c.Company);
        setSelectedCompanies(openAts);
        setLoadingFile(false);
      },
      error: (err: any) => {
        console.error('PapaParse error:', err);
        setLoadingFile(false);
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_CSV_BYTES) {
      setStatusMessage('CSV file is too large. Please upload a file smaller than 5 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseAndLoadCsv(text, file.name);
    };
    reader.readAsText(file);
  };

  // Segregation of companies
  const supportedAtsCompanies = companies.filter(c => !c.isInternalOrUnsupported);
  const internalAtsCompanies = companies.filter(c => c.isInternalOrUnsupported);

  // Live Query Execution
  const runLiveJobFetch = async () => {
    if (selectedCompanies.length === 0) {
      setStatusMessage('Please select at least one company from the Target Companies dropdown.');
      return;
    }

    setFetchingJobs(true);
    setJobs([]);
    setStatusMessage('');

    const targetList = supportedAtsCompanies.filter(c => selectedCompanies.includes(c.Company));
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    const openingCounts: Record<string, number> = Object.fromEntries(targetList.map(company => [company.Company, -1]));
    const fetchedCounts: Record<string, number> = Object.fromEntries(targetList.map(company => [company.Company, -1]));
    const fetchErrors: Record<string, string> = {};
    setCompanyOpeningCounts(openingCounts);
    setCompanyFetchedCounts(fetchedCounts);
    setCompanyFetchErrors(fetchErrors);
    setFetchProgress({ current: 0, total: targetList.length, company: '' });

    const fetchedList: JobItem[] = [];

    for (let i = 0; i < targetList.length; i++) {
      if (controller.signal.aborted) break;
      const comp = targetList[i];
      setFetchProgress({ current: i + 1, total: targetList.length, company: comp.Company });

      try {
        let companyJobs: JobItem[] = [];
        if (comp.normalizedAts === 'greenhouse') {
          companyJobs = await fetchGreenhouseJobs(comp.slug, comp.Company, controller.signal);
        } else if (comp.normalizedAts === 'ashby') {
          companyJobs = await fetchAshbyJobs(comp.slug, comp.Company, controller.signal);
        } else if (comp.normalizedAts === 'lever') {
          companyJobs = await fetchLeverJobs(comp.slug, comp.Company, controller.signal);
        } else if (comp.normalizedAts === 'smartrecruiters') {
          companyJobs = await fetchSmartRecruitersJobs(comp.slug, comp.Company, controller.signal);
        }
        fetchedCounts[comp.Company] = companyJobs.length;

        // Filters in memory
        const roleQueries = filters.role
          .split(',')
          .map(role => role.trim().toLowerCase())
          .filter(Boolean)
          .map(role => role.split(/\s+/).filter(Boolean));
        const locTargets = filters.location
          ? filters.location.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
          : [];
        const cleanKws = filters.keywords
          ? filters.keywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
          : [];

        const matched = companyJobs.filter(job => {
          // 1. Role Filter
          const titleWords = job.title.toLowerCase();
          if (roleQueries.length > 0 && !roleQueries.some(words => words.every(word => titleWords.includes(word)))) return false;

          // 2. Continent / Region Filter
          if (filters.continent && filters.continent !== 'All Continents') {
            const continents = filters.continent.split(',').map(value => value.trim()).filter(Boolean);
            if (!isLocationInAnyContinent(job.location, continents)) {
              return false;
            }
          }

          // 3. Location (Comma-separated ANY match)
          if (locTargets.length > 0) {
            const jLoc = (job.location || '').toLowerCase();
            if (!locTargets.some(target => jLoc.includes(target))) return false;
          }

          // 4. JD Keywords (Always ANY match mode)
          if (cleanKws.length > 0) {
            const combinedText = `${job.title} ${job.location} ${job.experience} ${job.description}`.toLowerCase();
            if (!cleanKws.some(kw => combinedText.includes(kw))) {
              return false;
            }
          }

          return true;
        });

        fetchedList.push(...matched);
        openingCounts[comp.Company] = matched.length;
      } catch (err) {
        if (controller.signal.aborted) break;
        fetchErrors[comp.Company] = err instanceof Error ? err.message : 'Unknown fetch error';
        console.warn(`Error fetching ${comp.Company}:`, err);
      }
    }

    setJobs(fetchedList);
    setCompanyOpeningCounts(openingCounts);
    setCompanyFetchedCounts(fetchedCounts);
    setCompanyFetchErrors(fetchErrors);
    setFetchingJobs(false);
    fetchControllerRef.current = null;
    setStatusMessage(controller.signal.aborted
      ? `Fetching stopped. Found ${fetchedList.length} matching job opportunities so far.`
      : `Completed! Found ${fetchedList.length} matching job opportunities across ${targetList.length} companies.`);
  };

  const stopLiveJobFetch = () => {
    fetchControllerRef.current?.abort();
  };

  return (
    <Box sx={{ mt: 1 }}>
      {/* Top Banner: Bring Your Own Dataset or Active Dataset Header */}
      {companies.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 4,
            border: '1.5px dashed #93c5fd',
            background: 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 60%, #f8fafc 100%)',
            boxShadow: '0 4px 20px -2px rgba(26, 115, 232, 0.08)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid size={{ xs: 12, md: 8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box
                  sx={{
                    bgcolor: '#1a73e8',
                    color: '#ffffff',
                    p: 1,
                    borderRadius: 2.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(26, 115, 232, 0.3)'
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="#0f172a" sx={{ letterSpacing: -0.3 }}>
                    Bring Your Own Dataset
                  </Typography>
                  <Typography variant="body2" color="#475569" fontWeight={500}>
                    To run the ATS Checker and query live positions, upload a CSV file with your target companies.
                  </Typography>
                </Box>
              </Box>

              {/* Format Specification Box */}
              <Box
                sx={{
                  bgcolor: '#ffffff',
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid #e2e8f0',
                  mt: 2,
                  maxWidth: 700
                }}
              >
                <Typography variant="caption" fontWeight={700} color="#1a73e8" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 0.8 }}>
                  Required CSV Schema & Column Headers:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1.2 }}>
                  <Chip
                    label="Company"
                    size="small"
                    sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontFamily: 'monospace' }}
                  />
                  <Chip
                    label="ATS"
                    size="small"
                    sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontFamily: 'monospace' }}
                  />
                  <Chip
                    label="Job URL"
                    size="small"
                    sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, fontFamily: 'monospace' }}
                  />
                </Box>
                <Typography variant="caption" color="#64748b" sx={{ lineHeight: 1.5, display: 'block' }}>
                  • <strong>Company</strong>: Company name (e.g., Figma, Stripe, Datadog)<br />
                  • <strong>ATS</strong>: Supported ATS name (<code>greenhouse</code>, <code>ashby</code>, <code>lever</code>, <code>smartrecruiters</code>) or enterprise portal (<code>workday</code>, <code>internal</code>)<br />
                  • <strong>Job URL</strong>: Sample job opening or career page link (used to identify board tokens and provide direct links)
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: { xs: 'stretch', md: 'flex-end' } }}>
                <Button
                  variant="contained"
                  component="label"
                  size="large"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    bgcolor: '#1a73e8',
                    '&:hover': { bgcolor: '#1557b0' },
                    px: 3.5,
                    py: 1.5,
                    fontWeight: 700,
                    fontSize: '1rem',
                    borderRadius: 3,
                    boxShadow: '0 6px 20px rgba(26, 115, 232, 0.35)'
                  }}
                >
                  Upload Your Companies CSV
                  <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
                </Button>

                <Button
                  variant="outlined"
                  size="medium"
                  onClick={loadSampleDataset}
                  disabled={loadingFile}
                  sx={{
                    borderColor: '#94a3b8',
                    color: '#334155',
                    '&:hover': { borderColor: '#1a73e8', color: '#1a73e8', bgcolor: '#f0f7ff' },
                    fontWeight: 600,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    px: 2.5
                  }}
                >
                  {loadingFile ? 'Loading Sample...' : 'Or Quick Start with Sample Dataset'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      ) : (
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
          <Grid container spacing={2.5} alignItems="center" justifyContent="space-between">
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  sx={{
                    bgcolor: '#1a73e8',
                    '&:hover': { bgcolor: '#1557b0' },
                    px: 2.5,
                    py: 1,
                    fontWeight: 700,
                    borderRadius: 2.5,
                    boxShadow: '0 4px 14px rgba(26, 115, 232, 0.2)'
                  }}
                >
                  Upload Different CSV
                  <input type="file" accept=".csv" hidden onChange={handleFileUpload} />
                </Button>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                    Active Dataset: <span style={{ color: '#1a73e8' }}>{loadingFile ? 'Loading...' : fileName}</span>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Loaded: <strong>{companies.length} companies</strong> • Format: <code>Company, ATS, Job URL</code>
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
                <Chip
                  icon={<CheckCircleOutlineIcon sx={{ color: '#16a34a !important' }} />}
                  label={`${supportedAtsCompanies.length} Open ATS Companies`}
                  sx={{
                    bgcolor: '#f0fdf4',
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    fontWeight: 700,
                    py: 2,
                    px: 1,
                    borderRadius: 2
                  }}
                />
                <Chip
                  label={`${internalAtsCompanies.length} Internal / Closed Portals`}
                  sx={{
                    bgcolor: '#fef2f2',
                    color: '#b91c1c',
                    border: '1px solid #fecaca',
                    fontWeight: 700,
                    py: 2,
                    px: 1,
                    borderRadius: 2
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Segregated Sub-Tabs */}
      <Box sx={{ borderBottom: '2px solid #e2e8f0', mb: 3.5 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1.05rem',
              py: 2,
              px: 3
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <span>Live Open ATS Job Finder</span>
                <Chip
                  label={supportedAtsCompanies.length}
                  size="small"
                  sx={{ bgcolor: activeTab === 0 ? '#1a73e8' : '#e2e8f0', color: activeTab === 0 ? '#ffffff' : '#475569', fontWeight: 700 }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <span>No Matching Companies</span>
                <Chip
                  label={Object.values(companyOpeningCounts).filter(count => count === 0).length}
                  size="small"
                  sx={{ bgcolor: '#fff7ed', color: '#9a3412', fontWeight: 700 }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <span>Internal & Closed Portals</span>
                <Chip
                  label={internalAtsCompanies.length}
                  size="small"
                  sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontWeight: 700 }}
                />
              </Box>
            }
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <span>Applied Positions</span>
                <Chip
                  label={appliedJobsList.length}
                  size="small"
                  sx={{
                    bgcolor: activeTab === 3 ? '#16a34a' : '#dcfce7',
                    color: activeTab === 3 ? '#ffffff' : '#15803d',
                    fontWeight: 700
                  }}
                />
              </Box>
            }
          />
        </Tabs>
      </Box>

      {/* TAB 1: LIVE OPEN ATS JOB FINDER */}
      {activeTab === 0 && (
        <Box>
          {/* Enhanced Filter Search Card */}
          <Paper
            elevation={0}
            sx={{
              mb: 4,
              p: { xs: 3, md: 4 },
              borderRadius: 4,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ bgcolor: '#e8f0fe', p: 1, borderRadius: 2, display: 'flex' }}>
                <FilterAltIcon sx={{ color: '#1a73e8', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#0f172a">
                  Filter Job Search
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Specify your role, target region, and keywords to query real-time ATS openings
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {/* 1. Role Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" fontWeight={700} color="#475569" sx={{ display: 'block', mb: 0.8 }}>
                  ROLE / JOB TITLE
                </Typography>
                <TextField
                  fullWidth
                  size="medium"
                  value={filters.role}
                  onChange={(e) => setFilters(f => ({ ...f, role: e.target.value }))}
                  placeholder="e.g. Software Engineer, Backend"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#64748b', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5 }
                  }}
                />
              </Grid>

              {/* 2. Region / Continent Filter */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" fontWeight={700} color="#475569" sx={{ display: 'block', mb: 0.8 }}>
                  REGIONS / CONTINENTS (ANY MATCH)
                </Typography>
                <FormControl fullWidth size="medium">
                  <Select
                    multiple
                    value={filters.continent === 'All Continents' ? ['All Continents'] : filters.continent.split(',').map(value => value.trim()).filter(Boolean)}
                    onChange={(e) => {
                      const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                      const selected = value as string[];
                      const selectedContinents = selected.filter(continent => continent !== 'All Continents');
                      const shouldSelectAll = selected.includes('All Continents') && filters.continent !== 'All Continents';
                      setFilters(f => ({
                        ...f,
                        continent: selected.length === 0 || shouldSelectAll
                          ? 'All Continents'
                          : selectedContinents.join(', ')
                      }));
                    }}
                    input={<OutlinedInput startAdornment={<InputAdornment position="start"><PublicIcon sx={{ color: '#64748b', fontSize: 20 }} /></InputAdornment>} sx={{ borderRadius: 2.5 }} />}
                    renderValue={(selected) => (selected as string[]).join(', ')}
                    sx={{ borderRadius: 2.5 }}
                  >
                    {CONTINENTS.map((continent) => (
                      <MenuItem key={continent} value={continent}>
                        <Checkbox checked={(filters.continent === 'All Continents'
                          ? ['All Continents']
                          : filters.continent.split(',').map(value => value.trim())).includes(continent)} size="small" />
                        <ListItemText primary={continent} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 3. Specific Location (Comma-separated ANY) */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" fontWeight={700} color="#475569" sx={{ display: 'block', mb: 0.8 }}>
                  SPECIFIC LOCATION (ANY MATCH)
                </Typography>
                <TextField
                  fullWidth
                  size="medium"
                  value={filters.location}
                  onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. San Francisco, India, Remote"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOnIcon sx={{ color: '#64748b', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2.5 }
                  }}
                />
              </Grid>

              {/* 4. JD Keywords (Always ANY Mode) */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Typography variant="caption" fontWeight={700} color="#475569" sx={{ display: 'block', mb: 0.8 }}>
                  JD KEYWORDS (ANY MATCH)
                </Typography>
                <TextField
                  fullWidth
                  size="medium"
                  value={filters.keywords}
                  onChange={(e) => setFilters(f => ({ ...f, keywords: e.target.value }))}
                  placeholder="e.g. 5+ years, visa, Python, Golang"
                  InputProps={{ sx: { borderRadius: 2.5 } }}
                />
              </Grid>

              {/* 5. Target Companies Dropdown with Polished Summary Bar */}
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
                  <Typography variant="caption" fontWeight={700} color="#475569">
                    TARGET COMPANIES ({selectedCompanies.length} SELECTED OF {supportedAtsCompanies.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<SelectAllIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setSelectedCompanies(supportedAtsCompanies.map(c => c.Company))}
                      sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a73e8', p: 0.5 }}
                    >
                      Select All ({supportedAtsCompanies.length})
                    </Button>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<ClearIcon sx={{ fontSize: 16 }} />}
                      onClick={() => setSelectedCompanies([])}
                      sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', p: 0.5 }}
                    >
                      Clear Selection
                    </Button>
                  </Box>
                </Box>

                <FormControl fullWidth size="medium">
                  <Select
                    multiple
                    value={selectedCompanies}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedCompanies(typeof val === 'string' ? val.split(',') : val);
                    }}
                    input={<OutlinedInput sx={{ borderRadius: 2.5 }} />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.2 }}>
                        <Typography variant="body2" fontWeight={700} color="#0f172a">
                          {selected.length} companies selected
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          ({selected.slice(0, 8).join(', ')}{selected.length > 8 ? `, +${selected.length - 8} more` : ''})
                        </Typography>
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 380,
                          width: 360,
                          borderRadius: 14,
                          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)'
                        }
                      }
                    }}
                  >
                    {supportedAtsCompanies.map((c) => (
                      <MenuItem key={c.Company} value={c.Company} sx={{ py: 1 }}>
                        <Checkbox checked={selectedCompanies.includes(c.Company)} size="small" color="primary" />
                        <ListItemText
                          primary={c.Company}
                          secondary={`ATS: ${c.ATS}`}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.92rem' }}
                          secondaryTypographyProps={{ fontSize: '0.78rem' }}
                        />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Run Query Button */}
            <Box sx={{ mt: 3.5, pt: 3, borderTop: '1px solid #edf2f7', display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={fetchingJobs ? <CircularProgress size={22} color="inherit" /> : <PlayArrowIcon />}
                onClick={runLiveJobFetch}
                disabled={fetchingJobs || selectedCompanies.length === 0}
                sx={{
                  bgcolor: '#1a73e8',
                  '&:hover': { bgcolor: '#1557b0' },
                  px: 4.5,
                  py: 1.4,
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  borderRadius: 2.5,
                  boxShadow: '0 4px 16px rgba(26, 115, 232, 0.3)'
                }}
              >
                {fetchingJobs ? 'Fetching Live Jobs...' : 'Find Live Jobs'}
              </Button>

              {fetchingJobs && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<StopIcon />}
                  onClick={stopLiveJobFetch}
                  sx={{ fontWeight: 700, borderRadius: 2.5 }}
                >
                  Stop Fetching
                </Button>
              )}

              {fetchingJobs && (
                <Typography variant="body2" color="#475569" fontWeight={500}>
                  Querying ATS [{fetchProgress.current} / {fetchProgress.total}]: <strong style={{ color: '#1a73e8' }}>{fetchProgress.company}</strong>
                </Typography>
              )}
            </Box>

            {statusMessage && (
              <Alert
                severity={statusMessage.startsWith('Please') ? 'warning' : 'success'}
                sx={{ mt: 3, borderRadius: 2.5, fontWeight: 600 }}
              >
                {statusMessage}
              </Alert>
            )}
          </Paper>

          {/* Job Results List with Company Heading on Top and Positions Below */}
          <JobList
            jobs={jobs}
            companyOpeningCounts={companyOpeningCounts}
            companyFetchErrors={companyFetchErrors}
            appliedJobIds={appliedJobIds}
            onToggleApplied={handleToggleApplied}
          />
        </Box>
      )}

      {/* TAB 2: INTERNAL & CLOSED ATS VIEW */}
      {activeTab === 1 && (
        <NoMatchingCompaniesView
          companies={supportedAtsCompanies
            .filter(company => companyOpeningCounts[company.Company] === 0)
            .sort((a, b) => a.Company.localeCompare(b.Company))}
          fetchedCounts={companyFetchedCounts}
          failedCompanies={supportedAtsCompanies
            .filter(company => Boolean(companyFetchErrors[company.Company]))
            .sort((a, b) => a.Company.localeCompare(b.Company))}
          fetchErrors={companyFetchErrors}
        />
      )}

      {/* TAB 3: INTERNAL & CLOSED ATS VIEW */}
      {activeTab === 2 && (
        <InternalAtsPortal companies={internalAtsCompanies} />
      )}

      {/* TAB 4: APPLIED POSITIONS VIEW */}
      {activeTab === 3 && (
        <AppliedPositionsView
          appliedJobs={appliedJobsList}
          onRemoveApplied={handleRemoveApplied}
        />
      )}
    </Box>
  );
};
