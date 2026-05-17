import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Paper, LinearProgress, CircularProgress, Alert, Tabs, Tab,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { resultsApi } from '../api';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
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

interface PortionEntry {
  portionId: string;
  portionName: string;
  portionWeight: number;
  portionScore: number;
  weightedContribution: number;
}

interface LeaderboardEntry {
  rank: number;
  participant: { id: string; name: string; number: number };
  finalScore: number;
  portionBreakdown: PortionEntry[];
}

interface LeaderboardData {
  event: { id: string; name: string; status: string };
  leaderboard: LeaderboardEntry[];
}

export default function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!id) return;
    const load = () => {
      resultsApi.getLeaderboard(id)
        .then((res) => setData(res.data as LeaderboardData))
        .catch(() => setError('Failed to load leaderboard'))
        .finally(() => setLoading(false));
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress size={60} />
    </Box>
  );

  if (error || !data) return <Box p={4}><Alert severity="error">{error || 'Not found'}</Alert></Box>;

  const portions = data.leaderboard[0]?.portionBreakdown ?? [];
  const topScore = data.leaderboard[0]?.finalScore ?? 0;

  const getPortionRanking = (portionId: string) =>
    [...data.leaderboard]
      .map((e) => ({ entry: e, score: e.portionBreakdown.find((p) => p.portionId === portionId)?.portionScore ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0d1b2a', color: 'white' }}>
      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #7b1fa2 100%)', py: 5, textAlign: 'center' }}>
        <EmojiEventsIcon sx={{ fontSize: 64, color: '#ffd54f', mb: 1 }} />
        <Typography variant="h3" fontWeight={900} sx={{ textShadow: '0 3px 8px rgba(0,0,0,0.5)' }}>
          {data.event.name}
        </Typography>
        <Box display="flex" justifyContent="center" alignItems="center" gap={1} mt={1}>
          <Chip label={data.event.status.toUpperCase()} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
          <Typography sx={{ opacity: 0.6, fontSize: 12 }}>Auto-refreshes every 30s</Typography>
        </Box>
      </Box>

      <Box maxWidth={900} mx="auto" px={2} mt={3}>
        {data.leaderboard.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', mt: 6 }}>
            <Typography variant="h6" color="text.secondary">No scores yet — check back soon!</Typography>
          </Paper>
        ) : (
          <>
            {/* Podium */}
            {data.leaderboard.length >= 1 && (
              <Box display="flex" justifyContent="center" gap={2} mb={4} alignItems="flex-end" flexWrap="wrap">
                {data.leaderboard[1] && (
                  <Paper sx={{ p: 3, textAlign: 'center', width: 160, background: medalBg[2], border: '2px solid #bdbdbd' }}>
                    <Typography fontSize={40}>🥈</Typography>
                    <Typography fontWeight={700} noWrap color="text.primary">{data.leaderboard[1].participant.name}</Typography>
                    <Typography variant="h5" fontWeight={800} color="text.primary">{data.leaderboard[1].finalScore.toFixed(2)}</Typography>
                  </Paper>
                )}
                <Paper sx={{ p: 3, textAlign: 'center', width: 190, background: medalBg[1], border: '3px solid gold' }}>
                  <Typography fontSize={54}>🥇</Typography>
                  <Typography fontWeight={800} fontSize={16} noWrap color="text.primary">{data.leaderboard[0].participant.name}</Typography>
                  <Typography variant="h4" fontWeight={900} color="primary.dark">{data.leaderboard[0].finalScore.toFixed(2)}</Typography>
                </Paper>
                {data.leaderboard[2] && (
                  <Paper sx={{ p: 3, textAlign: 'center', width: 160, background: medalBg[3], border: '2px solid #ff8f00' }}>
                    <Typography fontSize={40}>🥉</Typography>
                    <Typography fontWeight={700} noWrap color="text.primary">{data.leaderboard[2].participant.name}</Typography>
                    <Typography variant="h5" fontWeight={800} color="text.primary">{data.leaderboard[2].finalScore.toFixed(2)}</Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Tabs */}
            <Paper>
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab icon={<LeaderboardIcon />} iconPosition="start" label="Overall" sx={{ fontWeight: 700 }} />
                {portions.map((pb) => (
                  <Tab
                    key={pb.portionId}
                    icon={<CategoryIcon />}
                    iconPosition="start"
                    label={
                      <Box>
                        {pb.portionName}
                        <Chip label={`${pb.portionWeight}%`} size="small" sx={{ ml: 0.5, fontSize: 10 }} />
                      </Box>
                    }
                  />
                ))}
              </Tabs>

              {/* Overall tab */}
              {tab === 0 && (
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#1565c0' }}>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rank</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Contestant</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Score</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 700 }}>Portions</TableCell>
                      <TableCell sx={{ color: 'white' }}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.leaderboard.map((entry) => (
                      <TableRow key={entry.participant.id} sx={{ background: entry.rank <= 3 ? medalBg[entry.rank] : 'white' }}>
                        <TableCell><Typography fontSize={24}>{rankMedal(entry.rank)}</Typography></TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip label={`#${entry.participant.number}`} size="small" />
                            <Typography fontWeight={700} fontSize={15}>{entry.participant.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="h6" fontWeight={800} color="primary.dark">{entry.finalScore.toFixed(2)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            {entry.portionBreakdown.map((pb) => (
                              <Chip
                                key={pb.portionId}
                                label={`${pb.portionName}: ${pb.portionScore.toFixed(1)}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: 10 }}
                              />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell width={160}>
                          <LinearProgress
                            variant="determinate"
                            value={topScore > 0 ? (entry.finalScore / topScore) * 100 : 0}
                            sx={{ height: 8, borderRadius: 4 }}
                            color={entry.rank === 1 ? 'warning' : 'primary'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Per-portion tabs */}
              {portions.map((pb, idx) => {
                if (tab !== idx + 1) return null;
                const ranked = getPortionRanking(pb.portionId);
                const topPortionScore = ranked[0]?.score ?? 0;
                return (
                  <Box key={pb.portionId}>
                    <Box sx={{ px: 2, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Typography fontWeight={700}>{pb.portionName} Rankings</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pb.portionWeight}% of final score — ranked by portion score only
                      </Typography>
                    </Box>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                          <TableCell>Rank</TableCell>
                          <TableCell>Contestant</TableCell>
                          <TableCell>Portion Score</TableCell>
                          <TableCell>Contribution to Final</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ranked.map(({ entry, score, rank }) => {
                          const contribution = entry.portionBreakdown.find((p) => p.portionId === pb.portionId)?.weightedContribution ?? 0;
                          return (
                            <TableRow key={entry.participant.id} sx={{ background: rank <= 3 ? medalBg[rank] : 'white' }}>
                              <TableCell><Typography fontSize={22}>{rankMedal(rank)}</Typography></TableCell>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Chip label={`#${entry.participant.number}`} size="small" />
                                  <Typography fontWeight={600}>{entry.participant.name}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Typography variant="h6" fontWeight={800} color="primary.main">
                                  {score.toFixed(2)}
                                  <Typography component="span" variant="caption" color="text.secondary"> / 100</Typography>
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>+{contribution.toFixed(2)} pts</Typography>
                                <Typography variant="caption" color="text.secondary">to final score</Typography>
                              </TableCell>
                              <TableCell width={140}>
                                <LinearProgress
                                  variant="determinate"
                                  value={topPortionScore > 0 ? (score / topPortionScore) * 100 : 0}
                                  sx={{ height: 8, borderRadius: 4 }}
                                  color={rank === 1 ? 'warning' : 'primary'}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                );
              })}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  );
}