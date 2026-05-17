import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Tabs, Tab, Button, TextField, Chip,
  Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, LinearProgress, Tooltip, Paper, Select, MenuItem,
  FormControl, InputLabel, Accordion, AccordionSummary,
  AccordionDetails, Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi, participantsApi, judgesApi, portionsApi, resultsApi } from '../api';
import type { EventDetail, ScoringProgress, Portion } from '../types';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartIcon from '@mui/icons-material/BarChart';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<ScoringProgress | null>(null);

  // Participant form
  const [pName, setPName] = useState('');
  const [pNum, setPNum] = useState('');

  // Judge form
  const [jName, setJName] = useState('');
  const [jEmail, setJEmail] = useState('');

  // Portion form
  const [portionName, setPortionName] = useState('');
  const [portionWeight, setPortionWeight] = useState('');
  const [editingPortion, setEditingPortion] = useState<Portion | null>(null);
  const [editPortionName, setEditPortionName] = useState('');
  const [editPortionWeight, setEditPortionWeight] = useState('');

  // Criterion form (per portion)
  const [criterionForms, setCriterionForms] = useState<Record<string, { name: string; weight: string; maxScore: string }>>({});

  // Edit event
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const load = async () => {
    if (!id) return;
    try {
      const [eventRes, progressRes] = await Promise.all([
        eventsApi.getById(id),
        resultsApi.getProgress(id),
      ]);
      setEvent(eventRes.data);
      setProgress(progressRes.data);
      setEditName(eventRes.data.name);
      setEditDesc(eventRes.data.description || '');
      setEditDate(eventRes.data.eventDate || '');
      setEditStatus(eventRes.data.status);
    } catch {
      setError('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const totalPortionWeight = event?.portions.reduce((s, p) => s + p.weight, 0) ?? 0;

  // ── Participants ──────────────────────────────────────────────────────────
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim() || !id) return;
    try {
      await participantsApi.add(id, { name: pName, number: pNum ? parseInt(pNum) : undefined });
      setPName(''); setPNum('');
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add participant');
    }
  };

  const handleDeleteParticipant = async (pid: string) => {
    if (!confirm('Remove this participant?')) return;
    try { await participantsApi.delete(pid); load(); }
    catch { setError('Failed to remove participant'); }
  };

  // ── Judges ────────────────────────────────────────────────────────────────
  const handleAddJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jName.trim() || !jEmail.trim() || !id) return;
    try {
      await judgesApi.add(id, { name: jName, email: jEmail });
      setJName(''); setJEmail('');
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add judge');
    }
  };

  const handleDeleteJudge = async (jid: string) => {
    if (!confirm('Remove this judge?')) return;
    try { await judgesApi.delete(jid); load(); }
    catch { setError('Failed to remove judge'); }
  };

  const copyJudgeLink = (token: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/judge/${token}`);
  };

  // ── Portions ──────────────────────────────────────────────────────────────
  const handleAddPortion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portionName.trim() || !portionWeight || !id) return;
    try {
      await portionsApi.add(id, { name: portionName, weight: parseFloat(portionWeight) });
      setPortionName(''); setPortionWeight('');
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add portion');
    }
  };

  const handleDeletePortion = async (portionId: string) => {
    if (!id || !confirm('Delete this portion and all its criteria?')) return;
    try { await portionsApi.delete(id, portionId); load(); }
    catch { setError('Failed to delete portion'); }
  };

  const handleSavePortion = async () => {
    if (!id || !editingPortion) return;
    try {
      await portionsApi.update(id, editingPortion.id, {
        name: editPortionName,
        weight: parseFloat(editPortionWeight),
      });
      setEditingPortion(null);
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to update portion');
    }
  };

  // ── Criteria ──────────────────────────────────────────────────────────────
  const getCriterionForm = (portionId: string) =>
    criterionForms[portionId] || { name: '', weight: '', maxScore: '100' };

  const setCriterionForm = (portionId: string, field: string, value: string) => {
    setCriterionForms((prev) => ({
      ...prev,
      [portionId]: { ...getCriterionForm(portionId), [field]: value },
    }));
  };

  const handleAddCriterion = async (e: React.FormEvent, portionId: string) => {
    e.preventDefault();
    if (!id) return;
    const form = getCriterionForm(portionId);
    if (!form.name.trim() || !form.weight) return;
    try {
      await portionsApi.addCriterion(id, portionId, {
        name: form.name,
        weight: parseFloat(form.weight),
        maxScore: form.maxScore ? parseFloat(form.maxScore) : 100,
      });
      setCriterionForms((prev) => ({ ...prev, [portionId]: { name: '', weight: '', maxScore: '100' } }));
      load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add criterion');
    }
  };

  const handleDeleteCriterion = async (portionId: string, criteriaId: string) => {
    if (!id || !confirm('Remove this criterion?')) return;
    try { await portionsApi.deleteCriterion(id, portionId, criteriaId); load(); }
    catch { setError('Failed to remove criterion'); }
  };

  // ── Edit event ────────────────────────────────────────────────────────────
  const handleSaveEvent = async () => {
    if (!id) return;
    try {
      await eventsApi.update(id, { name: editName, description: editDesc, eventDate: editDate, status: editStatus as EventDetail['status'] });
      setEditOpen(false);
      load();
    } catch { setError('Failed to update event'); }
  };

  if (loading) return <Layout><LinearProgress /></Layout>;
  if (!event) return <Layout><Alert severity="error">Event not found</Alert></Layout>;

  const statusColor: Record<string, 'default' | 'warning' | 'success'> = {
    draft: 'default', active: 'warning', completed: 'success',
  };

  return (
    <Layout maxWidth="xl">
      {/* Header */}
      <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
        <IconButton onClick={() => navigate('/')}><ArrowBackIcon /></IconButton>
        <Box flexGrow={1}>
          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
            <Typography variant="h4" fontWeight={700}>{event.name}</Typography>
            <Chip label={event.status} color={statusColor[event.status]} size="small" sx={{ textTransform: 'capitalize' }} />
          </Box>
          {event.description && <Typography color="text.secondary">{event.description}</Typography>}
        </Box>
        <Button variant="outlined" onClick={() => setEditOpen(true)}>Edit</Button>
        <Button variant="contained" startIcon={<BarChartIcon />} onClick={() => navigate(`/events/${id}/results`)}>
          View Results
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Progress */}
      {progress && (
        <Paper sx={{ p: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" fontWeight={600} minWidth={130}>Scoring Progress</Typography>
          <LinearProgress variant="determinate" value={progress.percentComplete} sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} />
          <Typography variant="body2" color="text.secondary">{progress.percentComplete}%</Typography>
          <Typography variant="caption" color="text.disabled">{progress.totalSubmitted}/{progress.totalExpected} scores</Typography>
        </Paper>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`Participants (${event.participants.length})`} />
        <Tab label={`Judges (${event.judges.length})`} />
        <Tab label={`Portions & Criteria (${event.portions.length})`} />
      </Tabs>

      {/* ── PARTICIPANTS TAB ── */}
      {tab === 0 && (
        <Box>
          <Box component="form" onSubmit={handleAddParticipant} display="flex" gap={2} mb={3}>
            <TextField label="#" value={pNum} onChange={(e) => setPNum(e.target.value)} type="number" sx={{ width: 80 }} />
            <TextField label="Name *" value={pName} onChange={(e) => setPName(e.target.value)} sx={{ flexGrow: 1 }} />
            <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={!pName.trim()}>Add</Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell><TableCell>Name</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {event.participants.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell><Chip label={p.number} size="small" /></TableCell>
                  <TableCell><Typography fontWeight={500}>{p.name}</Typography></TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleDeleteParticipant(p.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {event.participants.length === 0 && (
                <TableRow><TableCell colSpan={3} align="center"><Typography color="text.disabled" py={3}>No participants yet</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* ── JUDGES TAB ── */}
      {tab === 1 && (
        <Box>
          <Box component="form" onSubmit={handleAddJudge} display="flex" gap={2} mb={3}>
            <TextField label="Name *" value={jName} onChange={(e) => setJName(e.target.value)} sx={{ flexGrow: 1 }} />
            <TextField label="Email *" type="email" value={jEmail} onChange={(e) => setJEmail(e.target.value)} sx={{ flexGrow: 1 }} />
            <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={!jName.trim() || !jEmail.trim()}>
              Add & Send Link
            </Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell><TableCell>Email</TableCell>
                <TableCell>Progress</TableCell><TableCell>Link</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {event.judges.map((j) => {
                const jp = progress?.judgeProgress.find((x) => x.judgeId === j.id);
                return (
                  <TableRow key={j.id} hover>
                    <TableCell><Typography fontWeight={500}>{j.name}</Typography></TableCell>
                    <TableCell>{j.email}</TableCell>
                    <TableCell>
                      {jp && (
                        <Box>
                          <LinearProgress variant="determinate" value={jp.percent} sx={{ height: 6, borderRadius: 3, width: 100 }} />
                          <Typography variant="caption">{jp.submitted}/{jp.expected}</Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Copy link"><IconButton size="small" onClick={() => copyJudgeLink(j.token)}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                      <Tooltip title="Resend email"><IconButton size="small" onClick={() => judgesApi.resendLink(j.id)}><SendIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="error" onClick={() => handleDeleteJudge(j.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {event.judges.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center"><Typography color="text.disabled" py={3}>No judges yet</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* ── PORTIONS & CRITERIA TAB ── */}
      {tab === 2 && (
        <Box>
          {/* Portion weight summary */}
          <Alert
            severity={totalPortionWeight === 100 ? 'success' : totalPortionWeight > 100 ? 'error' : 'info'}
            sx={{ mb: 3 }}
          >
            <strong>Total portion weight: {totalPortionWeight}%</strong>
            {totalPortionWeight === 100
              ? ' ✓ All portions balanced'
              : ` — ${100 - totalPortionWeight}% remaining`}
          </Alert>

          {/* Add portion form */}
          <Box component="form" onSubmit={handleAddPortion} display="flex" gap={2} mb={3} alignItems="center">
            <TextField
              label="Portion Name *"
              placeholder="e.g. Casual Wear, Swim Wear, Q&A"
              value={portionName}
              onChange={(e) => setPortionName(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <TextField
              label="Weight (%)"
              type="number"
              value={portionWeight}
              onChange={(e) => setPortionWeight(e.target.value)}
              sx={{ width: 120 }}
              inputProps={{ min: 1, max: 100 }}
            />
            <Button type="submit" variant="contained" startIcon={<AddIcon />} disabled={!portionName.trim() || !portionWeight}>
              Add Portion
            </Button>
          </Box>

          {event.portions.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }}>
              <Typography color="text.secondary">No portions yet.</Typography>
              <Typography variant="body2" color="text.disabled" mt={1}>
                Add portions like "Casual Wear (30%)", "Swim Wear (30%)", "Q&A (40%)" for a pageant,
                or "Match Score (100%)" for a sports event.
              </Typography>
            </Paper>
          )}

          {/* Portions list */}
          {event.portions.map((portion) => {
            const totalCriteriaWeight = portion.criteria.reduce((s, c) => s + c.weight, 0);
            const form = getCriterionForm(portion.id);

            return (
              <Accordion key={portion.id} defaultExpanded sx={{ mb: 2, '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={2} width="100%">
                    <Typography fontWeight={700} fontSize={16}>{portion.name}</Typography>
                    <Chip
                      label={`${portion.weight}% of final`}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                    <Box flexGrow={1} />
                    <Tooltip title="Edit portion">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPortion(portion);
                          setEditPortionName(portion.name);
                          setEditPortionWeight(String(portion.weight));
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete portion">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => { e.stopPropagation(); handleDeletePortion(portion.id); }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Alert
                    severity={totalCriteriaWeight === 100 ? 'success' : totalCriteriaWeight > 100 ? 'error' : 'info'}
                    sx={{ mb: 2 }}
                    icon={false}
                  >
                    Criteria weights within "{portion.name}": <strong>{totalCriteriaWeight}%</strong>
                    {totalCriteriaWeight < 100 && ` (${100 - totalCriteriaWeight}% remaining)`}
                  </Alert>

                  {/* Criteria table */}
                  {portion.criteria.length > 0 && (
                    <Table size="small" sx={{ mb: 2 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Criterion</TableCell>
                          <TableCell>Weight</TableCell>
                          <TableCell>Max Score</TableCell>
                          <TableCell align="right">Remove</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {portion.criteria.map((c) => (
                          <TableRow key={c.id} hover>
                            <TableCell><Typography fontWeight={500}>{c.name}</Typography></TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={c.weight}
                                  sx={{ width: 50, height: 5, borderRadius: 3 }}
                                />
                                <Typography variant="body2">{c.weight}%</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{c.maxScore}</TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteCriterion(portion.id, c.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {/* Add criterion form */}
                  <Box
                    component="form"
                    onSubmit={(e) => handleAddCriterion(e, portion.id)}
                    display="flex"
                    gap={1}
                    alignItems="center"
                    sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}
                  >
                    <TextField
                      label="Criterion Name"
                      size="small"
                      value={form.name}
                      onChange={(e) => setCriterionForm(portion.id, 'name', e.target.value)}
                      sx={{ flexGrow: 1 }}
                    />
                    <TextField
                      label="Weight %"
                      type="number"
                      size="small"
                      value={form.weight}
                      onChange={(e) => setCriterionForm(portion.id, 'weight', e.target.value)}
                      sx={{ width: 100 }}
                      inputProps={{ min: 1, max: 100 }}
                    />
                    <TextField
                      label="Max Score"
                      type="number"
                      size="small"
                      value={form.maxScore}
                      onChange={(e) => setCriterionForm(portion.id, 'maxScore', e.target.value)}
                      sx={{ width: 100 }}
                    />
                    <Button
                      type="submit"
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      disabled={!form.name.trim() || !form.weight}
                    >
                      Add
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Edit Event Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent>
          <TextField label="Name *" fullWidth value={editName} onChange={(e) => setEditName(e.target.value)} sx={{ mt: 1, mb: 2 }} />
          <TextField label="Description" fullWidth multiline rows={2} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} sx={{ mb: 2 }} />
          <TextField label="Event Date" type="date" fullWidth value={editDate} onChange={(e) => setEditDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ mb: 2 }} />
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(e.target.value)}>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEvent}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Portion Dialog */}
      <Dialog open={!!editingPortion} onClose={() => setEditingPortion(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Portion</DialogTitle>
        <DialogContent>
          <TextField
            label="Portion Name *"
            fullWidth
            value={editPortionName}
            onChange={(e) => setEditPortionName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Weight (%)"
            type="number"
            fullWidth
            value={editPortionWeight}
            onChange={(e) => setEditPortionWeight(e.target.value)}
            inputProps={{ min: 1, max: 100 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditingPortion(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePortion}>Save</Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}