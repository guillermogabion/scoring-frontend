import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Grid, Card, CardContent, CardActions,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Tooltip, Skeleton, Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { eventsApi } from '../api';
import type { Event } from '../types';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import GavelIcon from '@mui/icons-material/Gavel';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useAuth } from '../context/AuthContext';

const statusColors: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
  draft: 'default',
  active: 'warning',
  completed: 'success',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDate, setNewDate] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const res = await eventsApi.getAll();
      // Safely handle array or wrapped response
      const raw = res.data as unknown;
      if (Array.isArray(raw)) {
        setEvents(raw as Event[]);
      } else if (raw && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).data)) {
        setEvents((raw as Record<string, unknown>).data as Event[]);
      } else {
        setEvents([]);
      }
    } catch {
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await eventsApi.create({ name: newName, description: newDesc, eventDate: newDate });
      setEvents((prev) => [res.data, ...prev]);
      setCreateOpen(false);
      setNewName(''); setNewDesc(''); setNewDate('');
      navigate(`/events/${res.data.id}`);
    } catch {
      setError('Failed to create event');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this event and all its data?')) return;
    try {
      await eventsApi.delete(id);
      setEvents((prev) => prev.filter((ev) => ev.id !== id));
    } catch {
      setError('Failed to delete event');
    }
  };

  return (
    <Layout>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>My Events</Typography>
          <Typography color="text.secondary">Welcome back, {user?.name}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} size="large">
          New Event
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : events.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center', py: 10, border: '2px dashed', borderColor: 'divider',
            borderRadius: 3, cursor: 'pointer',
          }}
          onClick={() => setCreateOpen(true)}
        >
          <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No events yet</Typography>
          <Typography color="text.disabled">Click to create your first event</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {events.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <Card
                sx={{ height: '100%', cursor: 'pointer', '&:hover': { boxShadow: 4 }, transition: 'box-shadow 0.2s' }}
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                    <Chip
                      label={event.status}
                      color={statusColors[event.status]}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                    <Tooltip title="Delete event">
                      <IconButton size="small" onClick={(e) => handleDelete(event.id, e)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Typography variant="h6" fontWeight={700} noWrap>{event.name}</Typography>
                  {event.description && (
                    <Typography variant="body2" color="text.secondary" noWrap>{event.description}</Typography>
                  )}
                  {event.eventDate && (
                    <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
                      {new Date(event.eventDate).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 2 }}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="caption">{event._count?.participants ?? 0}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <GavelIcon fontSize="small" color="action" />
                    <Typography variant="caption">{event._count?.judges ?? 0}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <CategoryIcon fontSize="small" color="action" />
                    <Typography variant="caption">{event._count?.portions ?? 0}</Typography>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Event Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <TextField
            label="Event Name *"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Event Date"
            type="date"
            fullWidth
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
          >
            {creating ? 'Creating...' : 'Create Event'}
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}