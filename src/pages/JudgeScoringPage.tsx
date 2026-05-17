import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Slider, TextField,
  Button, Alert, LinearProgress, Chip, Paper,
  CircularProgress, Divider, Tooltip, Avatar,
  Stepper, Step, StepButton,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { scoringApi } from '../api';
import type { JudgePanel, Participant, Criterion, Portion } from '../types';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GavelIcon from '@mui/icons-material/Gavel';

export default function JudgeScoringPage() {
  const { token } = useParams<{ token: string }>();
  const [panel, setPanel] = useState<JudgePanel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Portion-first navigation
  const [activePortion, setActivePortion] = useState(0);

  const scoreKey = (participantId: string, criteriaId: string) => `${participantId}_${criteriaId}`;

  useEffect(() => {
    if (!token) return;
    scoringApi.getJudgePanel(token)
      .then((res) => {
        setPanel(res.data);
        setScores(res.data.existingScores);
        const savedMap: Record<string, boolean> = {};
        Object.keys(res.data.existingScores).forEach((k) => { savedMap[k] = true; });
        setSaved(savedMap);
      })
      .catch((err) => setError(err?.response?.data?.message || 'Invalid or expired scoring link'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleScoreChange = (participantId: string, criteriaId: string, value: number) => {
    const key = scoreKey(participantId, criteriaId);
    setScores((prev) => ({ ...prev, [key]: value }));
    setSaved((prev) => ({ ...prev, [key]: false }));
  };

  const handleSaveScore = useCallback(async (participantId: string, criteriaId: string) => {
    if (!token) return;
    const key = scoreKey(participantId, criteriaId);
    const score = scores[key];
    if (score == null) return;
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await scoringApi.submitScore(token, { participantId, criteriaId, score });
      setSaved((prev) => ({ ...prev, [key]: true }));
    } catch {
      setError('Failed to save score. Please try again.');
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  }, [token, scores]);

  const handleSubmitAll = async () => {
    if (!token || !panel) return;
    setSubmitting(true);
    try {
      const allScores = panel.participants.flatMap((p) =>
        panel.portions.flatMap((portion) =>
          portion.criteria.map((c) => ({
            participantId: p.id,
            criteriaId: c.id,
            score: scores[scoreKey(p.id, c.id)] ?? 0,
          }))
        )
      );
      await scoringApi.submitAllScores(token, allScores);
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Progress per portion
  const getPortionProgress = (portion: Portion) => {
    if (!panel) return 0;
    const total = panel.participants.length * portion.criteria.length;
    if (total === 0) return 100;
    const filled = panel.participants.reduce((sum, p) =>
      sum + portion.criteria.filter((c) => scores[scoreKey(p.id, c.id)] != null).length, 0
    );
    return Math.round((filled / total) * 100);
  };

  // Overall progress
  const getOverallProgress = () => {
    if (!panel) return 0;
    const allCriteria = panel.portions.flatMap((p) => p.criteria);
    const total = panel.participants.length * allCriteria.length;
    if (total === 0) return 100;
    const filled = panel.participants.reduce((sum, p) =>
      sum + allCriteria.filter((c) => scores[scoreKey(p.id, c.id)] != null).length, 0
    );
    return Math.round((filled / total) * 100);
  };

  // ── Participant score for one portion (sum of weighted criteria, 0-100) ──
  const getParticipantPortionScore = (participantId: string, portion: Portion): number => {
    return portion.criteria.reduce((sum, c) => {
      const s = scores[scoreKey(participantId, c.id)];
      if (s == null) return sum;
      return sum + ((s / c.maxScore) * 100 * c.weight) / 100;
    }, 0);
  };

  // ── Loading / Error / Submitted screens ──────────────────────────────────
  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" flexDirection="column" gap={2}>
      <CircularProgress size={48} />
      <Typography color="text.secondary">Loading scoring panel...</Typography>
    </Box>
  );

  if (error && !panel) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={2}>
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', p: 5 }}>
          <GavelIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} color="error">Access Denied</Typography>
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        </CardContent>
      </Card>
    </Box>
  );

  if (submitted) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" p={2}
      sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
      <Card sx={{ maxWidth: 440, width: '100%' }}>
        <CardContent sx={{ textAlign: 'center', p: 5 }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 80 }} />
          <Typography variant="h4" fontWeight={800} mt={2}>All Done!</Typography>
          <Typography color="text.secondary" mt={1} fontSize={16}>
            Thank you, <strong>{panel?.judge.name}</strong>.<br />
            Your scores for <strong>{panel?.event.name}</strong> have been submitted.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );

  if (!panel) return null;

  const currentPortion = panel.portions[activePortion];
  const overallProgress = getOverallProgress();
  const isLastPortion = activePortion === panel.portions.length - 1;
  const currentPortionProgress = currentPortion ? getPortionProgress(currentPortion) : 0;

  return (
    <Box sx={{ bgcolor: '#f5f7fa', minHeight: '100vh' }}>

      {/* ── Top header ─────────────────────────────────────────────────── */}
      <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', color: 'white', py: 3, px: 3 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
          <EmojiEventsIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1}>{panel.event.name}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Judge: <strong>{panel.judge.name}</strong>
            </Typography>
          </Box>
          <Box flexGrow={1} />
          <Box textAlign="right">
            <Typography variant="h4" fontWeight={900}>{overallProgress}%</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>overall done</Typography>
          </Box>
        </Box>
        <LinearProgress
          variant="determinate"
          value={overallProgress}
          sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#69f0ae' } }}
        />
      </Box>

      {/* ── Portion stepper ────────────────────────────────────────────── */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 2, py: 1.5, overflowX: 'auto' }}>
        <Stepper nonLinear activeStep={activePortion} alternativeLabel sx={{ minWidth: panel.portions.length * 120 }}>
          {panel.portions.map((portion, idx) => {
            const pp = getPortionProgress(portion);
            return (
              <Step key={portion.id} completed={pp === 100}>
                <StepButton onClick={() => setActivePortion(idx)}>
                  <Box textAlign="center">
                    <Typography variant="caption" fontWeight={700} display="block">{portion.name}</Typography>
                    <Chip
                      label={`${portion.weight}%`}
                      size="small"
                      color={pp === 100 ? 'success' : idx === activePortion ? 'primary' : 'default'}
                      sx={{ fontSize: 10, height: 18 }}
                    />
                  </Box>
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
      </Box>

      {/* ── Current portion panel ──────────────────────────────────────── */}
      {currentPortion && (
        <Box maxWidth={900} mx="auto" px={2} py={3}>

          {/* Portion header card */}
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)', border: '2px solid', borderColor: 'primary.light' }}>
            <CardContent sx={{ py: 2 }}>
              <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                <Box>
                  <Typography variant="h5" fontWeight={800}>{currentPortion.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentPortion.weight}% of final score &nbsp;·&nbsp;
                    {currentPortion.criteria.length} criteria &nbsp;·&nbsp;
                    {panel.participants.length} contestants
                  </Typography>
                </Box>
                <Box flexGrow={1} />
                <Box textAlign="right">
                  <LinearProgress
                    variant="determinate"
                    value={currentPortionProgress}
                    sx={{ width: 120, height: 8, borderRadius: 4, mb: 0.5 }}
                    color={currentPortionProgress === 100 ? 'success' : 'primary'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {currentPortionProgress}% of this portion scored
                  </Typography>
                </Box>
              </Box>

              {/* Criteria chips */}
              <Box display="flex" gap={1} mt={1.5} flexWrap="wrap">
                {currentPortion.criteria.map((c) => (
                  <Chip
                    key={c.id}
                    label={`${c.name} (${c.weight}% · max ${c.maxScore})`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

          {/* ── One card per contestant ─────────────────────────────── */}
          {panel.participants.map((participant: Participant, pIdx: number) => {
            const participantPortionScore = getParticipantPortionScore(participant.id, currentPortion);
            const allScoredForParticipant = currentPortion.criteria.every(
              (c) => scores[scoreKey(participant.id, c.id)] != null
            );

            return (
              <Card
                key={participant.id}
                sx={{
                  mb: 2.5,
                  border: '2px solid',
                  borderColor: allScoredForParticipant ? 'success.light' : 'grey.200',
                  transition: 'border-color 0.3s',
                }}
              >
                {/* Contestant header */}
                <Box
                  sx={{
                    px: 3, py: 1.5,
                    bgcolor: allScoredForParticipant ? 'success.50' : 'grey.50',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: allScoredForParticipant ? 'success.main' : 'primary.main',
                      width: 36, height: 36, fontWeight: 700,
                    }}
                  >
                    {allScoredForParticipant ? <CheckCircleIcon fontSize="small" /> : participant.number}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700} fontSize={16}>
                      #{participant.number} — {participant.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Contestant {pIdx + 1} of {panel.participants.length}
                    </Typography>
                  </Box>
                  <Box flexGrow={1} />
                  {allScoredForParticipant && (
                    <Box textAlign="right">
                      <Typography variant="caption" color="text.secondary" display="block">Portion score</Typography>
                      <Typography variant="h6" fontWeight={800} color="primary.main">
                        {participantPortionScore.toFixed(2)}
                        <Typography component="span" variant="caption" color="text.secondary"> / 100</Typography>
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Criteria scoring */}
                <CardContent sx={{ pt: 2 }}>
                  {currentPortion.criteria.map((criterion: Criterion, cIdx: number) => {
                    const key = scoreKey(participant.id, criterion.id);
                    const currentScore = scores[key] ?? 0;
                    const isSaving = saving[key];
                    const isSaved = saved[key];

                    return (
                      <Box key={criterion.id}>
                        {cIdx > 0 && <Divider sx={{ my: 2 }} />}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                          <Box>
                            <Typography fontWeight={600}>{criterion.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Weight: {criterion.weight}% within this portion &nbsp;·&nbsp; Max: {criterion.maxScore}
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1} ml={2}>
                            <TextField
                              type="number"
                              value={currentScore}
                              onChange={(e) => {
                                const v = Math.min(Math.max(parseFloat(e.target.value) || 0, 0), criterion.maxScore);
                                handleScoreChange(participant.id, criterion.id, v);
                              }}
                              size="small"
                              sx={{ width: 88 }}
                              inputProps={{ min: 0, max: criterion.maxScore, step: 0.5 }}
                            />
                            <Tooltip title={isSaved ? 'Score saved' : 'Save this score'}>
                              <span>
                                <Button
                                  size="small"
                                  variant={isSaved ? 'outlined' : 'contained'}
                                  color={isSaved ? 'success' : 'primary'}
                                  onClick={() => handleSaveScore(participant.id, criterion.id)}
                                  disabled={isSaving}
                                  sx={{ minWidth: 80 }}
                                >
                                  {isSaving
                                    ? '...'
                                    : isSaved
                                      ? <><CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />Saved</>
                                      : <><SaveIcon fontSize="small" sx={{ mr: 0.5 }} />Save</>
                                  }
                                </Button>
                              </span>
                            </Tooltip>
                          </Box>
                        </Box>

                        <Box px={1}>
                          <Slider
                            value={currentScore}
                            min={0}
                            max={criterion.maxScore}
                            step={0.5}
                            onChange={(_, v) => handleScoreChange(participant.id, criterion.id, v as number)}
                            onChangeCommitted={() => handleSaveScore(participant.id, criterion.id)}
                            valueLabelDisplay="auto"
                            sx={{
                              color: isSaved ? 'success.main' : 'primary.main',
                              '& .MuiSlider-thumb': { width: 20, height: 20 },
                            }}
                            marks={[
                              { value: 0, label: '0' },
                              { value: criterion.maxScore * 0.25, label: `${criterion.maxScore * 0.25}` },
                              { value: criterion.maxScore * 0.5, label: `${criterion.maxScore * 0.5}` },
                              { value: criterion.maxScore * 0.75, label: `${criterion.maxScore * 0.75}` },
                              { value: criterion.maxScore, label: `${criterion.maxScore}` },
                            ]}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}

          {/* ── Portion navigation ──────────────────────────────────── */}
          <Box display="flex" gap={2} mt={3}>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              disabled={activePortion === 0}
              onClick={() => setActivePortion((p) => p - 1)}
              sx={{ flex: 1 }}
            >
              {activePortion > 0 ? panel.portions[activePortion - 1].name : 'Previous'}
            </Button>

            {isLastPortion ? (
              <Button
                variant="contained"
                size="large"
                color="success"
                disabled={submitting || overallProgress < 100}
                onClick={handleSubmitAll}
                sx={{ flex: 2, py: 1.5, fontWeight: 700, fontSize: '1rem' }}
              >
                {submitting
                  ? 'Submitting...'
                  : overallProgress < 100
                    ? `Submit All  (${overallProgress}% done)`
                    : '✓ Submit All Scores'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => setActivePortion((p) => p + 1)}
                sx={{ flex: 2, py: 1.5, fontWeight: 700 }}
                color={currentPortionProgress === 100 ? 'success' : 'primary'}
              >
                {currentPortionProgress === 100 ? '✓ Done — Next: ' : 'Next: '}
                {panel.portions[activePortion + 1]?.name}
              </Button>
            )}
          </Box>

          {/* Portion progress summary */}
          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="body2" fontWeight={700} mb={1.5}>Portion Progress</Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              {panel.portions.map((portion, idx) => {
                const pp = getPortionProgress(portion);
                return (
                  <Box
                    key={portion.id}
                    display="flex"
                    alignItems="center"
                    gap={2}
                    sx={{
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: idx === activePortion ? 'primary.50' : 'transparent',
                      '&:hover': { bgcolor: 'grey.100' },
                    }}
                    onClick={() => setActivePortion(idx)}
                  >
                    <Box minWidth={140}>
                      <Typography variant="body2" fontWeight={600}>{portion.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{portion.weight}% of final</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pp}
                      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                      color={pp === 100 ? 'success' : 'primary'}
                    />
                    <Chip
                      label={pp === 100 ? '✓ Done' : `${pp}%`}
                      size="small"
                      color={pp === 100 ? 'success' : idx === activePortion ? 'primary' : 'default'}
                    />
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}