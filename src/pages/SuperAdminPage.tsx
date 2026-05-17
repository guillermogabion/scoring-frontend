import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, Tabs, Tab,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, IconButton, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Tooltip, Avatar,
  LinearProgress, Select, MenuItem, FormControl, InputLabel,
  Badge, Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { superAdminApi } from '../api';
import type { User, PlatformStats, Event } from '../types';
import { useAuth } from '../context/AuthContext';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import LockResetIcon from '@mui/icons-material/LockReset';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GavelIcon from '@mui/icons-material/Gavel';
import ScoreboardIcon from '@mui/icons-material/Scoreboard';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';

type AdminEvent = Event & {
  user: { name: string; email: string };
  _count: { participants: number; judges: number; criteria: number; scores: number };
};

const StatCard = ({
  label, value, icon, color, sub,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) => (
  <Card>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 52, height: 52, borderRadius: 2,
          bgcolor: `${color}.light`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Box sx={{ color: `${color}.dark` }}>{icon}</Box>
      </Box>
      <Box>
        <Typography variant="h5" fontWeight={800}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        {sub && <Typography variant="caption" color="text.disabled">{sub}</Typography>}
      </Box>
    </CardContent>
  </Card>
);

export default function SuperAdminPage() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // User filter/search
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Dialogs
  const [resetDialog, setResetDialog] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: '', name: '' });
  const [newPassword, setNewPassword] = useState('');
  const [createDialog, setCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [eventFilter, setEventFilter] = useState('ALL');

  useEffect(() => {
    if (!isSuperAdmin) { navigate('/'); return; }
    loadAll();
  }, [isSuperAdmin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, eventsRes] = await Promise.all([
        superAdminApi.getStats(),
        superAdminApi.getAllUsers(),
        superAdminApi.getAllEvents(),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setEvents(eventsRes.data as AdminEvent[]);
    } catch {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const notify = (msg: string, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const res = await superAdminApi.toggleActive(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, isActive: !u.isActive } : u));
      notify((res.data as { message: string }).message);
    } catch { notify('Failed to toggle user status', true); }
  };

  const handleRoleChange = async (id: string, role: 'USER' | 'SUPER_ADMIN') => {
    try {
      await superAdminApi.updateRole(id, role);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
      notify(`Role updated to ${role}`);
    } catch { notify('Failed to update role', true); }
  };

  const handleForceVerify = async (id: string) => {
    try {
      await superAdminApi.forceVerifyEmail(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, emailVerified: true } : u));
      notify('Email verified');
    } catch { notify('Failed to verify email', true); }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) { notify('Password must be at least 8 characters', true); return; }
    try {
      await superAdminApi.resetPassword(resetDialog.userId, newPassword);
      setResetDialog({ open: false, userId: '', name: '' });
      setNewPassword('');
      notify('Password reset successfully');
    } catch { notify('Failed to reset password', true); }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}" and ALL their events/data? This cannot be undone.`)) return;
    try {
      await superAdminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      notify('User deleted');
      loadAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Failed to delete user', true);
    }
  };

  const handleImpersonate = async (id: string) => {
    if (!confirm('Impersonate this user? Their JWT will be loaded into your session.')) return;
    try {
      const res = await superAdminApi.impersonate(id);
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/';
    } catch { notify('Failed to impersonate user', true); }
  };

  const handleCreateUser = async () => {
    try {
      await superAdminApi.createUser(newUser);
      setCreateDialog(false);
      setNewUser({ name: '', email: '', password: '', role: 'USER' });
      notify('User created successfully');
      loadAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify(msg || 'Failed to create user', true);
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (!confirm(`Delete event "${name}"?`)) return;
    try {
      await superAdminApi.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      notify('Event deleted');
      loadAll();
    } catch { notify('Failed to delete event', true); }
  };

  const handleEventStatus = async (id: string, status: string) => {
    try {
      await superAdminApi.updateEventStatus(id, status);
      setEvents((prev) => prev.map((e) => e.id === id ? { ...e, status: status as Event['status'] } : e));
      notify(`Event status set to ${status}`);
    } catch { notify('Failed to update event status', true); }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = userSearch === '' ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const filteredEvents = events.filter((e) =>
    eventFilter === 'ALL' || e.status === eventFilter
  );

  const statusColor: Record<string, 'default' | 'warning' | 'success'> = {
    draft: 'default', active: 'warning', completed: 'success',
  };

  if (!isSuperAdmin) return null;

  return (
    <Layout maxWidth="xl">
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <Box
          sx={{
            width: 52, height: 52, borderRadius: 2, bgcolor: 'error.light',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <AdminPanelSettingsIcon color="error" sx={{ fontSize: 28 }} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800}>Super Admin Panel</Typography>
          <Typography color="text.secondary">Full platform control — logged in as {currentUser?.name}</Typography>
        </Box>
        <Box flexGrow={1} />
        <Button variant="outlined" onClick={loadAll}>Refresh</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {loading ? (
        <LinearProgress />
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <Grid container spacing={2} mb={4}>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard label="Total Users" value={stats.users.total} icon={<PeopleIcon />} color="primary"
                  sub={`${stats.users.active} active`} />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard label="Super Admins" value={stats.users.superAdmins} icon={<AdminPanelSettingsIcon />} color="error" />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard label="Total Events" value={stats.events.total} icon={<EmojiEventsIcon />} color="secondary"
                  sub={`${stats.events.active} active`} />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard label="Participants" value={stats.totalParticipants} icon={<PersonIcon />} color="info" />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard label="Judges" value={stats.totalJudges} icon={<GavelIcon />} color="warning" />
              </Grid>
              <Grid item xs={6} sm={4} md={2}>
                <StatCard label="Total Scores" value={stats.totalScores} icon={<ScoreboardIcon />} color="success" />
              </Grid>
            </Grid>
          )}

          {/* Event status summary */}
          {stats && (
            <Grid container spacing={2} mb={4}>
              {[
                { label: 'Draft Events', value: stats.events.draft, color: '#757575' },
                { label: 'Active Events', value: stats.events.active, color: '#ed6c02' },
                { label: 'Completed Events', value: stats.events.completed, color: '#2e7d32' },
              ].map((item) => (
                <Grid item xs={12} sm={4} key={item.label}>
                  <Paper sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                      <Typography variant="h6" fontWeight={700} color={item.color}>{item.value}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stats.events.total > 0 ? (item.value / stats.events.total) * 100 : 0}
                      sx={{ mt: 1, height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: item.color } }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label={`Users (${users.length})`} icon={<PeopleIcon />} iconPosition="start" />
            <Tab label={`Events (${events.length})`} icon={<EmojiEventsIcon />} iconPosition="start" />
          </Tabs>

          {/* ── USERS TAB ── */}
          {tab === 0 && (
            <Box>
              <Box display="flex" gap={2} mb={3} flexWrap="wrap">
                <TextField
                  placeholder="Search users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  size="small"
                  sx={{ width: 280 }}
                />
                <FormControl size="small" sx={{ width: 150 }}>
                  <InputLabel>Role</InputLabel>
                  <Select value={roleFilter} label="Role" onChange={(e) => setRoleFilter(e.target.value)}>
                    <MenuItem value="ALL">All Roles</MenuItem>
                    <MenuItem value="USER">User</MenuItem>
                    <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                  </Select>
                </FormControl>
                <Box flexGrow={1} />
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setCreateDialog(true)}
                >
                  Create User
                </Button>
              </Box>

              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Events</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow
                      key={u.id}
                      hover
                      sx={{
                        opacity: u.isActive ? 1 : 0.5,
                        bgcolor: u.role === 'SUPER_ADMIN' ? 'error.50' : 'white',
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: u.role === 'SUPER_ADMIN' ? 'error.main' : 'primary.main' }}>
                            {u.name[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </Box>
                          {u.id === currentUser?.id && (
                            <Chip label="You" size="small" color="primary" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" disabled={u.id === currentUser?.id}>
                          <Select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as 'USER' | 'SUPER_ADMIN')}
                            sx={{ fontSize: 12, height: 28 }}
                          >
                            <MenuItem value="USER">User</MenuItem>
                            <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} flexDirection="column">
                          <Chip
                            label={u.isActive ? 'Active' : 'Disabled'}
                            color={u.isActive ? 'success' : 'default'}
                            size="small"
                          />
                          {!u.emailVerified && (
                            <Chip label="Unverified" color="warning" size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{u.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={u._count?.events ?? 0} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} justifyContent="center">
                          {!u.emailVerified && (
                            <Tooltip title="Force verify email">
                              <IconButton size="small" color="success" onClick={() => handleForceVerify(u.id)}>
                                <VerifiedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Reset password">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => setResetDialog({ open: true, userId: u.id, name: u.name })}
                            >
                              <LockResetIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={u.isActive ? 'Deactivate user' : 'Activate user'}>
                            <span>
                              <IconButton
                                size="small"
                                color={u.isActive ? 'error' : 'success'}
                                onClick={() => handleToggleActive(u.id)}
                                disabled={u.id === currentUser?.id}
                              >
                                {u.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Impersonate user">
                            <span>
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => handleImpersonate(u.id)}
                                disabled={u.id === currentUser?.id}
                              >
                                <SupervisedUserCircleIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete user">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                disabled={u.id === currentUser?.id}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.disabled" py={3}>No users found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* ── EVENTS TAB ── */}
          {tab === 1 && (
            <Box>
              <Box display="flex" gap={2} mb={3}>
                <FormControl size="small" sx={{ width: 180 }}>
                  <InputLabel>Filter by Status</InputLabel>
                  <Select value={eventFilter} label="Filter by Status" onChange={(e) => setEventFilter(e.target.value)}>
                    <MenuItem value="ALL">All Statuses</MenuItem>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>Event</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Stats</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredEvents.map((e) => (
                    <TableRow key={e.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{e.name}</Typography>
                        {e.description && (
                          <Typography variant="caption" color="text.secondary" noWrap>{e.description}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{e.user.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{e.user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small">
                          <Select
                            value={e.status}
                            onChange={(ev) => handleEventStatus(e.id, ev.target.value)}
                            sx={{ fontSize: 12, height: 28 }}
                          >
                            <MenuItem value="draft">Draft</MenuItem>
                            <MenuItem value="active">Active</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip label={`${e._count.participants} participants`} size="small" variant="outlined" />
                          <Chip label={`${e._count.judges} judges`} size="small" variant="outlined" />
                          <Chip label={`${e._count.scores} scores`} size="small" variant="outlined" />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(e.createdAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5} justifyContent="center">
                          <Tooltip title="View results">
                            <IconButton size="small" onClick={() => navigate(`/events/${e.id}/results`)}>
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete event">
                            <IconButton size="small" color="error" onClick={() => handleDeleteEvent(e.id, e.name)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEvents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.disabled" py={3}>No events found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
        </>
      )}

      {/* Reset Password Dialog */}
      <Dialog open={resetDialog.open} onClose={() => setResetDialog({ open: false, userId: '', name: '' })} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password — {resetDialog.name}</DialogTitle>
        <DialogContent>
          <TextField
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="At least 8 characters"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialog({ open: false, userId: '', name: '' })}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleResetPassword}>Reset Password</Button>
        </DialogActions>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <TextField label="Full Name *" fullWidth value={newUser.name}
            onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} sx={{ mt: 1, mb: 2 }} />
          <TextField label="Email *" type="email" fullWidth value={newUser.email}
            onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} sx={{ mb: 2 }} />
          <TextField label="Password *" type="password" fullWidth value={newUser.password}
            onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
            helperText="At least 8 characters" sx={{ mb: 2 }} />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={newUser.role} label="Role"
              onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}>
              <MenuItem value="USER">User</MenuItem>
              <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
            </Select>
          </FormControl>
          <Alert severity="info" sx={{ mt: 2 }}>Admin-created accounts are automatically email-verified.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleCreateUser}
            disabled={!newUser.name || !newUser.email || !newUser.password}>
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
}