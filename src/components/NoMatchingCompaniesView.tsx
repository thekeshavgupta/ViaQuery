import React from 'react';
import {
    Box,
    Chip,
    Pagination,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import type { CompanyRecord } from '../types';

interface NoMatchingCompaniesViewProps {
    companies: CompanyRecord[];
    fetchedCounts: Record<string, number>;
    failedCompanies: CompanyRecord[];
    fetchErrors: Record<string, string>;
}

export const NoMatchingCompaniesView: React.FC<NoMatchingCompaniesViewProps> = ({ companies, fetchedCounts, failedCompanies, fetchErrors }) => {
    const [page, setPage] = React.useState(1);
    const companiesPerPage = 10;
    const totalPages = Math.ceil(companies.length / companiesPerPage) || 1;
    const currentCompanies = companies.slice((page - 1) * companiesPerPage, page * companiesPerPage);

    React.useEffect(() => {
        setPage(1);
    }, [companies]);

    if (companies.length === 0 && failedCompanies.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{ p: { xs: 4, md: 7 }, textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: 1, bgcolor: '#ffffff' }}
            >
                <SearchOffIcon sx={{ fontSize: 46, color: '#94a3b8', mb: 1 }} />
                <Typography variant="h5" fontWeight={800} color="#0f172a" gutterBottom>
                    No Non-Matched Companies
                </Typography>
                <Typography color="text.secondary">
                    Every queried company has at least one opening matching the current filters.
                </Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={800} color="#0f172a">
                        Companies Without Matching Openings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                        Queried companies with no openings matching the current role, region, location, or keyword filters.
                    </Typography>
                </Box>
                <Chip label={`${companies.length} companies`} sx={{ bgcolor: '#fff7ed', color: '#9a3412', fontWeight: 800 }} />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #fed7aa', borderRadius: 1, overflow: 'hidden' }}>
                <Table size="small" aria-label="Companies without matching openings">
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#fff7ed' }}>
                            <TableCell sx={{ fontWeight: 800, color: '#7c2d12' }}>Company</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#7c2d12' }}>Fetched openings</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#7c2d12' }}>ATS</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: '#7c2d12' }}>Careers</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {currentCompanies.map(company => {
                            const careersUrl = `https://www.google.com/search?q=${encodeURIComponent(`${company.Company} careers`)}`;
                            return (
                                <TableRow key={company.Company} hover>
                                    <TableCell sx={{ fontWeight: 700, color: '#334155' }}>{company.Company}</TableCell>
                                    <TableCell>{fetchedCounts[company.Company] ?? 0}</TableCell>
                                    <TableCell>
                                        <Chip label={company.ATS || 'Internal'} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700 }} />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Button
                                            href={careersUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            size="small"
                                            endIcon={<OpenInNewIcon sx={{ fontSize: 15 }} />}
                                            sx={{ textTransform: 'none', fontWeight: 700 }}
                                        >
                                            Open careers
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5, borderTop: '1px solid #fed7aa' }}>
                        <Pagination count={totalPages} page={page} onChange={(_, value) => setPage(value)} size="small" color="primary" shape="rounded" />
                    </Box>
                )}
            </TableContainer>

            {failedCompanies.length > 0 && (
                <TableContainer component={Paper} elevation={0} sx={{ mt: 3, border: '1px solid #fecaca', borderRadius: 1, overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 1.5, bgcolor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                        <Typography variant="subtitle2" fontWeight={800} color="#991b1b">
                            Companies That Could Not Be Fetched
                        </Typography>
                        <Typography variant="caption" color="#b91c1c">
                            These requests failed, so they are not counted as companies with or without matching openings.
                        </Typography>
                    </Box>
                    <Table size="small" aria-label="Companies that could not be fetched">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#fef2f2' }}>
                                <TableCell sx={{ fontWeight: 800, color: '#7f1d1d' }}>Company</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: '#7f1d1d' }}>Reason</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {failedCompanies.map(company => (
                                <TableRow key={company.Company} hover>
                                    <TableCell sx={{ fontWeight: 700 }}>{company.Company}</TableCell>
                                    <TableCell sx={{ color: '#7f1d1d' }}>{fetchErrors[company.Company]}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};
