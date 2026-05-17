import client from './client';
import type {
  Event, EventDetail, Participant, Judge, Portion, Criterion,
  ResultsData, JudgePanel, ScoringProgress, User, PlatformStats, AdminUser,
} from '../types';

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    client.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    client.post<{ token: string; user: { id: string; name: string; email: string; role: 'USER' | 'SUPER_ADMIN' } }>('/auth/login', data),
  verifyEmail: (token: string) => client.post('/auth/verify-email', { token }),
  getMe: () => client.get('/auth/me'),
};

// ── EVENTS ────────────────────────────────────────────────────────────────────
export const eventsApi = {
  getAll: () => client.get<Event[]>('/events'),
  create: (data: { name: string; description?: string; eventDate?: string }) =>
    client.post<Event>('/events', data),
  getById: (id: string) => client.get<EventDetail>(`/events/${id}`),
  update: (id: string, data: Partial<Event>) => client.put<Event>(`/events/${id}`, data),
  delete: (id: string) => client.delete(`/events/${id}`),
};

// ── PARTICIPANTS ───────────────────────────────────────────────────────────────
export const participantsApi = {
  getAll: (eventId: string) => client.get<Participant[]>(`/events/${eventId}/participants`),
  add: (eventId: string, data: { name: string; number?: number }) =>
    client.post<Participant>(`/events/${eventId}/participants`, data),
  delete: (id: string) => client.delete(`/participants/${id}`),
};

// ── JUDGES ────────────────────────────────────────────────────────────────────
export const judgesApi = {
  getAll: (eventId: string) => client.get<Judge[]>(`/events/${eventId}/judges`),
  add: (eventId: string, data: { name: string; email: string }) =>
    client.post<Judge>(`/events/${eventId}/judges`, data),
  delete: (id: string) => client.delete(`/judges/${id}`),
  resendLink: (id: string) => client.post(`/judges/${id}/resend`),
};

// ── PORTIONS + CRITERIA ───────────────────────────────────────────────────────
export const portionsApi = {
  getAll: (eventId: string) => client.get<Portion[]>(`/events/${eventId}/portions`),

  add: (eventId: string, data: { name: string; weight: number }) =>
    client.post<Portion>(`/events/${eventId}/portions`, data),

  update: (eventId: string, portionId: string, data: { name?: string; weight?: number }) =>
    client.put<Portion>(`/events/${eventId}/portions/${portionId}`, data),

  delete: (eventId: string, portionId: string) =>
    client.delete(`/events/${eventId}/portions/${portionId}`),

  addCriterion: (eventId: string, portionId: string, data: { name: string; weight: number; maxScore?: number }) =>
    client.post<Criterion>(`/events/${eventId}/portions/${portionId}/criteria`, data),

  deleteCriterion: (eventId: string, portionId: string, criteriaId: string) =>
    client.delete(`/events/${eventId}/portions/${portionId}/criteria/${criteriaId}`),
};

// ── SCORING ───────────────────────────────────────────────────────────────────
export const scoringApi = {
  getJudgePanel: (token: string) => client.get<JudgePanel>(`/judge/${token}`),
  submitScore: (token: string, data: { participantId: string; criteriaId: string; score: number }) =>
    client.post(`/judge/${token}/score`, data),
  submitAllScores: (token: string, scores: { participantId: string; criteriaId: string; score: number }[]) =>
    client.post(`/judge/${token}/scores`, { scores }),
};

// ── RESULTS ───────────────────────────────────────────────────────────────────
export const resultsApi = {
  getResults: (eventId: string) => client.get<ResultsData>(`/events/${eventId}/results`),
  getLeaderboard: (eventId: string) => client.get(`/events/${eventId}/leaderboard`),
  getProgress: (eventId: string) => client.get<ScoringProgress>(`/events/${eventId}/progress`),
};

// ── SUPER ADMIN ───────────────────────────────────────────────────────────────
export const superAdminApi = {
  getStats: () => client.get<PlatformStats>('/admin/stats'),
  getAllUsers: () => client.get<User[]>('/admin/users'),
  getUserById: (id: string) => client.get<AdminUser>(`/admin/users/${id}`),
  createUser: (data: { name: string; email: string; password: string; role?: string }) =>
    client.post('/admin/users', data),
  updateRole: (id: string, role: 'USER' | 'SUPER_ADMIN') =>
    client.patch(`/admin/users/${id}/role`, { role }),
  toggleActive: (id: string) => client.patch(`/admin/users/${id}/toggle-active`),
  forceVerifyEmail: (id: string) => client.patch(`/admin/users/${id}/verify-email`),
  resetPassword: (id: string, newPassword: string) =>
    client.patch(`/admin/users/${id}/reset-password`, { newPassword }),
  deleteUser: (id: string) => client.delete(`/admin/users/${id}`),
  impersonate: (id: string) =>
    client.post<{ token: string; user: User; message: string }>(`/admin/users/${id}/impersonate`),
  getAllEvents: () => client.get('/admin/events'),
  deleteEvent: (id: string) => client.delete(`/admin/events/${id}`),
  updateEventStatus: (id: string, status: string) =>
    client.patch(`/admin/events/${id}/status`, { status }),
};