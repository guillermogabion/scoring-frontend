import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Paper, IconButton, LinearProgress, Alert, Accordion,
  AccordionSummary, AccordionDetails, Divider, Tabs, Tab, Tooltip,
  TableContainer
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { resultsApi } from '../api';
import type { ResultsData, ParticipantResult, PortionBreakdown } from '../types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ShareIcon from '@mui/icons-material/Share';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import CategoryIcon from '@mui/icons-material/Category';
import RefreshIcon from '@mui/icons-material/Refresh';

const rankMedal = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
};

const medalBg: Record<number, string> = {
  1: 'linear-gradient(135deg, #fff8e1, #ffe082)',
  2: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)',
  3: 'linear-gradient(135deg, #fff3e0, #ffcc80)',
};

function PortionRankingTable({
  results,
  portion,
}: {
  results: ParticipantResult[];
  portion: PortionBreakdown & { portionId: string; portionName: string };
}) {
  const sorted = [...results]
    .map((r) => {
      const pb = r.portionBreakdown.find((p) => p.portionId === portion.portionId);
      return {
        result: r,
        portionScore: pb?.portionScore ?? 0,
        contribution: pb?.weightedContribution ?? 0
      };
    })
    .sort((a, b) => b.portionScore - a.portionScore)
    .map((item, idx) => ({ ...item, portionRank: idx + 1 }));

  const topScore = sorted[0]?.portionScore ?? 0;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ bgcolor: 'grey.100' }}>
            <TableCell width={60} sx={{ px: { xs: 1, sm: 2 } }}>Rank</TableCell>
            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>Contestant</TableCell>
            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>Portion Score</TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, width: 140 }}>Bar</TableCell>
            <TableCell sx={{ px: { xs: 1, sm: 2 } }}>Criteria Breakdown</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map(({ result, portionScore, contribution, portionRank }) => {
            const pb = result.portionBreakdown.find((p) => p.portionId === portion.portionId);
            return (
              <TableRow
                key={result.participant.id}
                sx={{ background: portionRank <= 3 ? medalBg[portionRank] : 'white' }}
              >
                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                  <Typography fontSize={{ xs: 16, sm: 20 }} lineHeight={1}>{rankMedal(portionRank)}</Typography>
                </TableCell>
                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Chip label={`#${result.participant.number ?? '?'}`} size="small" sx={{ height: 20, fontSize: '0.75rem' }} />
                    <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {result.participant.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                  <Typography variant="body1" fontWeight={800} color="primary.main" sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }}>
                    {(portionScore ?? 0).toFixed(2)}
                    <Typography component="span" variant="caption" color="text.secondary"> / 100</Typography>
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem' }}>
                    → +{(contribution ?? 0).toFixed(1)} pts
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, width: 140 }}>
                  <LinearProgress
                    variant="determinate"
                    value={topScore > 0 ? ((portionScore ?? 0) / topScore) * 100 : 0}
                    sx={{ height: 8, borderRadius: 4 }}
                    color={portionRank === 1 ? 'warning' : 'primary'}
                  />
                </TableCell>
                <TableCell sx={{ px: { xs: 1, sm: 2 }, py: 1 }}>
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    {pb?.criteriaBreakdown?.map((cb) => (
                      <Box key={cb.criteriaId} display="flex" gap={1} alignItems="center" flexWrap="wrap">
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: { xs: 70, sm: 100 }, fontSize: '0.75rem', noWrap: true }}>
                          {cb.criteriaName}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={cb.avgScore ?? 0}
                          sx={{ width: { xs: 30, sm: 50 }, height: 4, borderRadius: 3, display: { xs: 'none', sm: 'block' } }}
                        />
                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>
                          {(cb.avgScore ?? 0).toFixed(1)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Overall ranking table ─────────────────────────────────────────────────────
function OverallRankingTable({ results }: { results: ParticipantResult[] }) {
  const topScore = results[0]?.finalScore ?? 0;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto', width: '100%' }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: 'primary.main' }}>
            <TableCell sx={{ color: 'white', fontWeight: 700, px: { xs: 1, sm: 2 } }}>Rank</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700, px: { xs: 1, sm: 2 } }}>Contestant</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700, px: { xs: 1, sm: 2 } }}>Final Score</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700, display: { xs: 'none', sm: 'table-cell' } }}>Score Bar</TableCell>
            <TableCell sx={{ color: 'white', fontWeight: 700, px: { xs: 1, sm: 2 } }}>Portion Breakdown</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {results.map((r) => (
            <TableRow key={r.participant.id} hover sx={{ background: r.rank <= 3 ? medalBg[r.rank] : 'white' }}>
              <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                <Typography fontSize={{ xs: 20, sm: 26 }} lineHeight={1}>{rankMedal(r.rank)}</Typography>
              </TableCell>
              <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Chip label={`#${r.participant.number ?? '?'}`} size="small" />
                  <Typography fontWeight={700} sx={{ fontSize: { xs: '0.875rem', sm: '0.95rem' } }}>
                    {r.participant.name}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ px: { xs: 1, sm: 2 } }}>
                <Typography variant="h6" fontWeight={900} color="primary.main" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                  {(r.finalScore ?? 0).toFixed(2)}
                </Typography>
              </TableCell>
              <TableCell width={180} sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                <LinearProgress
                  variant="determinate"
                  value={topScore > 0 ? ((r.finalScore ?? 0) / topScore) * 100 : 0}
                  sx={{ height: 10, borderRadius: 6 }}
                  color={r.rank === 1 ? 'warning' : 'primary'}
                />
              </TableCell>
              <TableCell sx={{ px: { xs: 1, sm: 2 }, minWidth: { xs: 160, md: 'auto' } }}>
                <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ p: 0, minHeight: 'unset', '& .MuiAccordionSummary-content': { my: 0.5 } }}
                  >
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {r.portionBreakdown?.map((pb) => (
                        <Chip
                          key={pb.portionId}
                          label={`${pb.portionName.substring(0, 6)}..: ${(pb.portionScore ?? 0).toFixed(0)}`}
                          size="small"
                          variant="outlined"
                          color="primary"
                          sx={{ fontSize: 10, height: 20 }}
                        />
                      ))}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0, pt: 1 }}>
                    {r.portionBreakdown?.map((pb) => (
                      <Box key={pb.portionId} mb={1.5}>
                        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={0.5} gap={0.5}>
                          <Typography variant="body2" fontWeight={700}>{pb.portionName}</Typography>
                          <Box display="flex" gap={1} alignItems="center">
                            <Chip label={`${pb.portionWeight ?? 0}%`} size="small" sx={{ height: 18, fontSize: '0.7rem' }} />
                            <Typography variant="caption" fontWeight={800} color="primary.main">
                              {(pb.portionScore ?? 0).toFixed(1)} → +{(pb.weightedContribution ?? 0).toFixed(1)}pts
                            </Typography>
                          </Box>
                        </Box>
                        {pb.criteriaBreakdown?.map((cb) => (
                          <Box key={cb.criteriaId} display="flex" justifyContent="space-between" pl={1} py={0.25}
                            sx={{ borderLeft: '2px solid', borderColor: 'primary.light' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.725rem' }}>
                              {cb.criteriaName} ({cb.weight ?? 0}%)
                            </Typography>
                            <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.725rem', ml: 1 }}>
                              avg {(cb.avgScore ?? 0).toFixed(1)}
                            </Typography>
                          </Box>
                        ))}
                        <Divider sx={{ mt: 1 }} />
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ── Main results page ─────────────────────────────────────────────────────────
export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0); // 0 = overall, 1..N = portions

  useEffect(() => {
    if (!id) return;
    resultsApi.getResults(id)
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to load results'))
      .finally(() => setLoading(false));
  }, [id]);

  const copyLeaderboardLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/events/${id}/leaderboard`);
    alert('Public leaderboard link copied!');
  };

  if (loading) return <Layout><LinearProgress /></Layout>;
  if (error || !data) return <Layout><Alert severity="error">{error || 'No data'}</Alert></Layout>;

  const portions = data.results[0]?.portionBreakdown ?? [];

  return (
    <Layout maxWidth="xl">
      {/* Page header - FLEX ALIGNMENT REPAIRED FOR SMARTPHONES */}
      <Box
        display="flex"
        alignItems="flex-start"
        gap={{ xs: 1, sm: 2 }}
        mb={3}
      >
        <IconButton onClick={() => navigate(`/events/${id}`)} sx={{ mt: 0.5 }}>
          <ArrowBackIcon />
        </IconButton>

        <Box flexGrow={1} minWidth={0}>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              fontSize: { xs: '1.35rem', sm: '1.85rem', md: '2.125rem' },
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            Results — {data.event.name}
          </Typography>
          <Chip label={data.event.status} size="small" sx={{ textTransform: 'capitalize', mt: 0.5 }} />
        </Box>

        {/* Action Button cluster locked into horizontal configuration */}
        <Box display="flex" alignItems="center" gap={1} flexShrink={0} sx={{ mt: 0.5 }}>
          <Tooltip title="Copy Leaderboard Link" placement="top" arrow>
            <IconButton
              onClick={copyLeaderboardLink}
              sx={{
                backgroundColor: '#F1F5F9',
                color: '#1D4ED8',
                border: '1px solid #E2E8F0',
                transition: 'all 0.2s ease',
                padding: { xs: '6px', sm: '8px' },
                '&:hover': {
                  backgroundColor: '#E2E8F0',
                  transform: 'scale(1.05)',
                }
              }}
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <IconButton
            color="primary"
            disabled={loading}
            onClick={() => {
              setLoading(true);
              resultsApi.getResults(id!)
                .then((res) => setData(res.data))
                .finally(() => setLoading(false));
            }}
            sx={{
              backgroundColor: '#F1F5F9',
              color: '#1D4ED8',
              border: '1px solid #E2E8F0',
              transition: 'all 0.2s ease',
              padding: { xs: '6px', sm: '8px' },
              '&:hover': {
                backgroundColor: '#E2E8F0',
                transform: 'scale(1.05)',
              },
              '& .MuiSvgIcon-root': {
                animation: loading ? 'spin 1s linear infinite' : 'none'
              },
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {data.results.length === 0 ? (
        <Paper sx={{ p: { xs: 4, sm: 8 }, textAlign: 'center' }}>
          <EmojiEventsIcon sx={{ fontSize: { xs: 48, sm: 72 }, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary" mt={2}>No scores submitted yet</Typography>
          <Typography color="text.disabled" variant="body2">Results will appear here once judges start scoring.</Typography>
        </Paper>
      ) : (
        <>
          {/* ── Top 3 podium - STACKABLE RESPONSIVE DIRECTION ── */}
          {data.results.length >= 1 && (
            <Box
              display="flex"
              justifyContent="center"
              gap={{ xs: 1.5, sm: 2 }}
              mb={4}
              alignItems="flex-end"
              sx={{
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-end' }
              }}
            >
              {/* 2nd Place */}
              {data.results[1] && (
                <Paper elevation={3} sx={{ p: 2, textAlign: 'center', width: { xs: '100%', sm: 160, md: 170 }, maxWidth: 280, background: medalBg[2], border: '2px solid #bdbdbd', order: { xs: 2, sm: 1 } }}>
                  <Typography fontSize={{ xs: 32, sm: 42 }}>🥈</Typography>
                  <Typography fontWeight={700} noWrap>{data.results[1].participant.name}</Typography>
                  <Typography variant="h5" fontWeight={800}>{data.results[1].finalScore.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">2nd Place</Typography>
                </Paper>
              )}

              {/* 1st Place */}
              <Paper elevation={6} sx={{ p: 3, textAlign: 'center', width: { xs: '100%', sm: 180, md: 200 }, maxWidth: 300, background: medalBg[1], border: '3px solid #ffc107', order: { xs: 1, sm: 2 } }}>
                <Typography fontSize={{ xs: 44, sm: 56 }}>🥇</Typography>
                <Typography fontWeight={800} fontSize={{ xs: 15, sm: 17 }} noWrap>{data.results[0].participant.name}</Typography>
                <Typography variant="h4" fontWeight={900} color="primary.dark" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>{data.results[0].finalScore.toFixed(2)}</Typography>
                <Typography variant="caption" color="text.secondary">1st Place</Typography>
              </Paper>

              {/* 3rd Place */}
              {data.results[2] && (
                <Paper elevation={3} sx={{ p: 2, textAlign: 'center', width: { xs: '100%', sm: 160, md: 170 }, maxWidth: 280, background: medalBg[3], border: '2px solid #ff8f00', order: 3 }}>
                  <Typography fontSize={{ xs: 32, sm: 42 }}>🥉</Typography>
                  <Typography fontWeight={700} noWrap>{data.results[2].participant.name}</Typography>
                  <Typography variant="h5" fontWeight={800}>{data.results[2].finalScore.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">3rd Place</Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* ── Tabs Content Arena ── */}
          <Paper variant="outlined">
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}
            >
              <Tab
                icon={<LeaderboardIcon />}
                iconPosition="start"
                label="Overall"
                sx={{ fontWeight: 700, minHeight: 48 }}
              />
              {portions.map((pb) => (
                <Tab
                  key={pb.portionId}
                  icon={<CategoryIcon />}
                  iconPosition="start"
                  label={
                    <Box display="flex" alignItems="center">
                      {pb.portionName}
                      <Chip label={`${pb.portionWeight}%`} size="small" sx={{ ml: 0.5, fontSize: 9, height: 16 }} />
                    </Box>
                  }
                />
              ))}
            </Tabs>

            <Box p={0}>
              {tab === 0 && <OverallRankingTable results={data.results} />}

              {portions.map((pb, idx) =>
                tab === idx + 1 ? (
                  <Box key={pb.portionId} p={{ xs: 1, sm: 2 }}>
                    <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} gap={1} mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" fontWeight={700}>{pb.portionName}</Typography>
                        <Chip label={`${pb.portionWeight}% Final Weight`} color="primary" size="small" />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        • Ranked by judges average score parameters for this specific criteria portion.
                      </Typography>
                    </Box>
                    <PortionRankingTable
                      results={data.results}
                      portion={pb}
                    />
                  </Box>
                ) : null
              )}
            </Box>
          </Paper>
        </>
      )}
    </Layout>
  );
}