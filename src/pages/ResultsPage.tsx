import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Paper, IconButton, LinearProgress, Alert, Accordion,
  AccordionSummary, AccordionDetails, Button, Divider, Tabs, Tab,
  Card, CardContent, Avatar,
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
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: 'grey.100' }}>
          <TableCell width={60}>Rank</TableCell>
          <TableCell>Contestant</TableCell>
          <TableCell>Portion Score</TableCell>
          <TableCell>Bar</TableCell>
          <TableCell>Criteria Breakdown</TableCell>
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
              <TableCell>
                <Typography fontSize={20} lineHeight={1}>{rankMedal(portionRank)}</Typography>
              </TableCell>
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip label={`#${result.participant.number ?? '?'}`} size="small" />
                  <Typography fontWeight={600}>{result.participant.name}</Typography>
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="h6" fontWeight={800} color="primary.main">
                  {(portionScore ?? 0).toFixed(2)}
                  <Typography component="span" variant="caption" color="text.secondary"> / 100</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  → +{(contribution ?? 0).toFixed(2)} pts to final
                </Typography>
              </TableCell>
              <TableCell width={140}>
                <LinearProgress
                  variant="determinate"
                  value={topScore > 0 ? ((portionScore ?? 0) / topScore) * 100 : 0}
                  sx={{ height: 8, borderRadius: 4 }}
                  color={portionRank === 1 ? 'warning' : 'primary'}
                />
              </TableCell>
              <TableCell>
                {pb?.criteriaBreakdown?.map((cb) => (
                  <Box key={cb.criteriaId} display="flex" gap={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary" minWidth={120}>
                      {cb.criteriaName}
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={cb.avgScore ?? 0}
                      sx={{ width: 60, height: 5, borderRadius: 3 }}
                    />
                    <Typography variant="caption" fontWeight={600}>
                      {(cb.avgScore ?? 0).toFixed(1)}
                    </Typography>
                  </Box>
                ))}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

// ── Overall ranking table ─────────────────────────────────────────────────────
function OverallRankingTable({ results }: { results: ParticipantResult[] }) {
  const topScore = results[0]?.finalScore ?? 0;

  return (
    <Table>
      <TableHead>
        <TableRow sx={{ bgcolor: 'primary.main' }}>
          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rank</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Contestant</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Final Score</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Score Bar</TableCell>
          <TableCell sx={{ color: 'white', fontWeight: 700 }}>Portion Breakdown</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {results.map((r) => (
          <TableRow key={r.participant.id} hover sx={{ background: r.rank <= 3 ? medalBg[r.rank] : 'white' }}>
            <TableCell>
              <Typography fontSize={26} lineHeight={1}>{rankMedal(r.rank)}</Typography>
            </TableCell>
            <TableCell>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip label={`#${r.participant.number ?? '?'}`} size="small" />
                <Typography fontWeight={700} fontSize={15}>{r.participant.name}</Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Typography variant="h5" fontWeight={900} color="primary.main">
                {(r.finalScore ?? 0).toFixed(2)}
              </Typography>
            </TableCell>
            <TableCell width={180}>
              <LinearProgress
                variant="determinate"
                value={topScore > 0 ? ((r.finalScore ?? 0) / topScore) * 100 : 0}
                sx={{ height: 12, borderRadius: 6 }}
                color={r.rank === 1 ? 'warning' : 'primary'}
              />
            </TableCell>
            <TableCell>
              <Accordion sx={{ boxShadow: 'none', '&:before': { display: 'none' }, bgcolor: 'transparent' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ p: 0, minHeight: 'unset', '& .MuiAccordionSummary-content': { my: 0.5 } }}>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {r.portionBreakdown?.map((pb) => (
                      <Chip
                        key={pb.portionId}
                        label={`${pb.portionName}: ${(pb.portionScore ?? 0).toFixed(1)}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontSize: 11 }}
                      />
                    ))}
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0, pt: 1 }}>
                  {r.portionBreakdown?.map((pb) => (
                    <Box key={pb.portionId} mb={1.5}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2" fontWeight={700}>{pb.portionName}</Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          <Chip label={`${pb.portionWeight ?? 0}%`} size="small" />
                          <Typography variant="body2" fontWeight={800} color="primary.main">
                            {(pb.portionScore ?? 0).toFixed(2)} → +{(pb.weightedContribution ?? 0).toFixed(2)} pts
                          </Typography>
                        </Box>
                      </Box>
                      {pb.criteriaBreakdown?.map((cb) => (
                        <Box key={cb.criteriaId} display="flex" justifyContent="space-between" pl={1.5} py={0.25}
                          sx={{ borderLeft: '2px solid', borderColor: 'primary.light' }}>
                          <Typography variant="caption" color="text.secondary">
                            {cb.criteriaName} ({cb.weight ?? 0}%)
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            avg {(cb.avgScore ?? 0).toFixed(1)} → {(cb.weightedScore ?? 0).toFixed(2)}
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

  // Get distinct portions from first result's portionBreakdown
  const portions = data.results[0]?.portionBreakdown ?? [];
  const topScore = data.results[0]?.finalScore ?? 0;

  return (
    <Layout maxWidth="xl">
      {/* Page header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate(`/events/${id}`)}><ArrowBackIcon /></IconButton>
        <Box flexGrow={1}>
          <Typography variant="h4" fontWeight={800}>Results — {data.event.name}</Typography>
          <Chip label={data.event.status} size="small" sx={{ textTransform: 'capitalize', mt: 0.5 }} />
        </Box>
        <Button variant="outlined" startIcon={<ShareIcon />} onClick={copyLeaderboardLink}>Share Leaderboard</Button>
        <Button variant="contained" onClick={() => { setLoading(true); resultsApi.getResults(id!).then((res) => setData(res.data)).finally(() => setLoading(false)); }}>
          Refresh
        </Button>
      </Box>

      {data.results.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <EmojiEventsIcon sx={{ fontSize: 72, color: 'text.disabled' }} />
          <Typography variant="h6" color="text.secondary" mt={2}>No scores submitted yet</Typography>
          <Typography color="text.disabled">Results will appear here once judges start scoring.</Typography>
        </Paper>
      ) : (
        <>
          {/* ── Top 3 podium ──────────────────────────────────────────── */}
          {data.results.length >= 1 && (
            <Box display="flex" justifyContent="center" gap={2} mb={4} flexWrap="wrap" alignItems="flex-end">
              {/* 2nd */}
              {data.results[1] && (
                <Paper elevation={3} sx={{ p: 3, textAlign: 'center', width: 170, background: medalBg[2], border: '2px solid #bdbdbd' }}>
                  <Typography fontSize={42}>🥈</Typography>
                  <Typography fontWeight={700} noWrap>{data.results[1].participant.name}</Typography>
                  <Typography variant="h5" fontWeight={800}>{data.results[1].finalScore.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">2nd Place</Typography>
                </Paper>
              )}
              {/* 1st */}
              <Paper elevation={6} sx={{ p: 3, textAlign: 'center', width: 200, background: medalBg[1], border: '3px solid #ffc107' }}>
                <Typography fontSize={56}>🥇</Typography>
                <Typography fontWeight={800} fontSize={17} noWrap>{data.results[0].participant.name}</Typography>
                <Typography variant="h4" fontWeight={900} color="primary.dark">{data.results[0].finalScore.toFixed(2)}</Typography>
                <Typography variant="caption" color="text.secondary">1st Place</Typography>
              </Paper>
              {/* 3rd */}
              {data.results[2] && (
                <Paper elevation={3} sx={{ p: 3, textAlign: 'center', width: 170, background: medalBg[3], border: '2px solid #ff8f00' }}>
                  <Typography fontSize={42}>🥉</Typography>
                  <Typography fontWeight={700} noWrap>{data.results[2].participant.name}</Typography>
                  <Typography variant="h5" fontWeight={800}>{data.results[2].finalScore.toFixed(2)}</Typography>
                  <Typography variant="caption" color="text.secondary">3rd Place</Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* ── Tabs: Overall + one tab per portion ───────────────────── */}
          <Paper>
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
                label="Overall Ranking"
                sx={{ fontWeight: 700 }}
              />
              {portions.map((pb) => (
                <Tab
                  key={pb.portionId}
                  icon={<CategoryIcon />}
                  iconPosition="start"
                  label={
                    <Box>
                      {pb.portionName}
                      <Chip label={`${pb.portionWeight}%`} size="small" sx={{ ml: 1, fontSize: 10 }} />
                    </Box>
                  }
                />
              ))}
            </Tabs>

            <Box p={0}>
              {/* Overall tab */}
              {tab === 0 && <OverallRankingTable results={data.results} />}

              {/* Per-portion tabs */}
              {portions.map((pb, idx) =>
                tab === idx + 1 ? (
                  <Box key={pb.portionId} p={2}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="h6" fontWeight={700}>{pb.portionName}</Typography>
                      <Chip label={`${pb.portionWeight}% of final score`} color="primary" size="small" />
                      <Typography variant="body2" color="text.secondary" ml={1}>
                        Ranking based on average score from all judges for this portion only
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